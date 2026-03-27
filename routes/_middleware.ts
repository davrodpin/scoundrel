import { getLogger } from "@logtape/logtape";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { createCleanupService } from "@scoundrel/cleanup";
import { createGameEngine } from "@scoundrel/engine";
import {
  createGameService,
  createPrismaGameRepository,
} from "@scoundrel/game-service";
import { createFeedbackService } from "@scoundrel/feedback";
import { config } from "@scoundrel/config";
import {
  flushLogs,
  flushMetrics,
  getMeter,
  getTracer,
  trace,
} from "@scoundrel/telemetry";
import type { Counter, Histogram } from "@opentelemetry/api";
import { define } from "@/utils.ts";
import {
  captureRequestBody,
  checkBodySize,
  extractClientIp,
  extractErrorInfo,
  extractErrorStatus,
  extractUserAgent,
  toErrorResponse,
} from "./_middleware_helpers.ts";

const tracer = getTracer();

// Lazily initialized on first request. getMeter() reads directly from the
// Grafana MeterProvider (activeMeterProvider), bypassing the OTel global API
// to avoid recording into a different provider registered first by Deno Deploy.
let requestCounter: Counter | undefined;
let requestDuration: Histogram | undefined;

function getInstruments(): { counter: Counter; histogram: Histogram } | null {
  if (!requestCounter) {
    const meter = getMeter();
    if (!meter) return null;
    requestCounter = meter.createCounter("http.server.request.count", {
      description: "Number of HTTP requests",
      unit: "{request}",
    });
    requestDuration = meter.createHistogram("http.server.request.duration", {
      description: "HTTP request duration",
      unit: "ms",
    });
  }
  return requestDuration
    ? { counter: requestCounter!, histogram: requestDuration }
    : null;
}

const UUID_SEGMENT_REGEX =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function normalizePath(path: string): string {
  return path.replace(UUID_SEGMENT_REGEX, "/{id}");
}

const pool = new pg.Pool({
  connectionString: config.db.url,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
// Eagerly establish one connection so the first real request doesn't pay
// the ~500ms cold-connect cost on a fresh Deno Deploy isolate.
pool.connect().then((client) => client.release()).catch(() => {});
const engine = createGameEngine();
const repository = createPrismaGameRepository(prisma, tracer);
const gameService = createGameService(
  engine,
  repository,
  {
    defaultPlayerName: config.game.defaultPlayerName,
    leaderboardLimit: config.game.leaderboardLimit,
  },
  tracer,
  getMeter,
);

const logger = getLogger(["scoundrel", "http"]);

const feedbackService = config.feedback
  ? createFeedbackService({
    trelloApiKey: config.feedback.trelloApiKey,
    trelloApiToken: config.feedback.trelloApiToken,
    trelloListId: config.feedback.trelloListId,
  })
  : null;

const cleanupService = createCleanupService(repository, {
  retentionDays: config.cleanup.retentionDays,
}, tracer);

if (typeof Deno.cron === "function") {
  Deno.cron("game-data-cleanup", "0 3 * * *", async () => {
    try {
      await cleanupService.runCleanup();
    } catch (error) {
      logger.error("Scheduled cleanup failed", { error });
    }
  });
}

const GAME_ID_REGEX = /\/api\/games\/([^/]+)/;

function extractGameId(path: string): string | undefined {
  return GAME_ID_REGEX.exec(path)?.[1];
}

function isStaticPath(path: string): boolean {
  return path.startsWith("/_fresh/") || path.startsWith("/static/");
}

const corsMiddleware = define.middleware(async (ctx) => {
  const response = await ctx.next();
  response.headers.set("Access-Control-Allow-Origin", config.app.origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
});

const errorMiddleware = define.middleware(async (ctx) => {
  try {
    return await ctx.next();
  } catch (error) {
    const response = toErrorResponse(error);
    if (response === null) {
      throw error;
    }
    if (response.status >= 500) {
      logger.error("Unhandled error", extractErrorInfo(error));
    }
    return response;
  }
});

const requestLoggingMiddleware = define.middleware(async (ctx) => {
  const method = ctx.req.method;
  const path = ctx.url.pathname;

  if (isStaticPath(path)) {
    return ctx.next();
  }

  const body = await captureRequestBody(ctx.req, method, path);
  const addr = ctx.info.remoteAddr;
  const remoteIp = "hostname" in addr ? addr.hostname : undefined;
  const clientIp = extractClientIp(ctx.req, remoteIp);
  const userAgent = extractUserAgent(ctx.req);

  // Enrich the auto-created Deno.serve HTTP span with route-level attributes
  const gameId = extractGameId(path);
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttribute("http.route", path);
    if (gameId) {
      activeSpan.setAttribute("game.id", gameId);
    }
    if (clientIp) {
      activeSpan.setAttribute("client.ip", clientIp);
    }
    activeSpan.setAttribute("user_agent.original", userAgent);
  }

  const start = Date.now();
  let response: Response;
  try {
    response = await ctx.next();
  } catch (error) {
    const duration = Date.now() - start;
    const status = extractErrorStatus(error);
    const metricAttrs: Record<string, string | number> = {
      service_name: "scoundrel",
      "http.request.method": method,
      "http.route": normalizePath(path),
      "http.response.status_code": status,
    };
    if (ctx.state.actionKind) {
      metricAttrs["action.kind"] = ctx.state.actionKind;
    }
    const instruments = getInstruments();
    if (instruments) {
      instruments.counter.add(1, metricAttrs);
      instruments.histogram.record(duration, metricAttrs);
      // Fire-and-forget: don't block the response on the ~550ms Grafana POST.
      // Metrics are best-effort; the in-flight fetch will usually complete
      // before Deno Deploy freezes the isolate.
      flushMetrics().catch(() => {});
    }
    logger.error("Request", {
      method,
      path,
      status,
      duration,
      gameId,
      body,
      clientIp,
      userAgent,
      ...extractErrorInfo(error),
    });
    flushLogs().catch(() => {});
    throw error;
  }
  const duration = Date.now() - start;
  const status = response.status;
  const metricAttrs: Record<string, string | number> = {
    service_name: "scoundrel",
    "http.request.method": method,
    "http.route": normalizePath(path),
    "http.response.status_code": status,
  };
  if (ctx.state.actionKind) {
    metricAttrs["action.kind"] = ctx.state.actionKind;
  }
  const instruments = getInstruments();
  if (instruments) {
    instruments.counter.add(1, metricAttrs);
    instruments.histogram.record(duration, metricAttrs);
    // Fire-and-forget: don't block the response on the ~550ms Grafana POST.
    // Metrics are best-effort; the in-flight fetch will usually complete
    // before Deno Deploy freezes the isolate.
    flushMetrics().catch(() => {});
  }

  const data = {
    method,
    path,
    status,
    duration,
    gameId,
    body,
    clientIp,
    userAgent,
  };

  if (status >= 500) {
    logger.error("Request", data);
  } else if (status >= 400) {
    logger.warn("Request", data);
  } else {
    logger.info("Request", data);
  }

  // Fire-and-forget: flush logs alongside metrics so they ship before the
  // Deno Deploy isolate freezes. Both are best-effort.
  flushLogs().catch(() => {});

  return response;
});

const bodySizeMiddleware = define.middleware((ctx) => {
  const { method } = ctx.req;
  if (
    (method === "POST" || method === "PUT" || method === "PATCH") &&
    ctx.url.pathname.startsWith("/api/")
  ) {
    checkBodySize(ctx.req, config.app.maxBodyBytes);
  }
  return ctx.next();
});

const diMiddleware = define.middleware((ctx) => {
  ctx.state.config = config;
  ctx.state.gameService = gameService;
  ctx.state.feedbackService = feedbackService;
  return ctx.next();
});

export const handler = [
  corsMiddleware,
  errorMiddleware,
  bodySizeMiddleware,
  requestLoggingMiddleware,
  diMiddleware,
];
