import { getLogger } from "@logtape/logtape";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { createGameEngine } from "@scoundrel/engine";
import {
  createGameService,
  createPrismaGameRepository,
} from "@scoundrel/game-service";
import { createRateLimiter } from "@scoundrel/rate-limit";
import { AppError } from "@scoundrel/errors";
import { define } from "@/utils.ts";
import {
  captureRequestBody,
  checkBodySize,
  extractClientIp,
  toErrorResponse,
} from "./_middleware_helpers.ts";

const pool = new pg.Pool({ connectionString: Deno.env.get("DATABASE_URL") });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const engine = createGameEngine();
const repository = createPrismaGameRepository(prisma);
const gameService = createGameService(engine, repository);

const logger = getLogger(["scoundrel", "http"]);

// Request body size limit: 4KB is generous for any game action JSON
const MAX_BODY_BYTES = 4096;

// Rate limiters per endpoint bucket (sliding window, per IP)
const createGameLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 5,
});
const submitActionLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});
const getEventsLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});
const globalApiLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
});

const APP_ORIGIN = Deno.env.get("APP_ORIGIN") ?? "https://scoundrel.deno.dev";

const GAME_ID_REGEX = /\/api\/games\/([^/]+)/;
const CREATE_GAME_PATH = /^\/api\/games\/?$/;
const SUBMIT_ACTION_PATH = /^\/api\/games\/[^/]+\/actions\/?$/;
const GET_EVENTS_PATH = /^\/api\/games\/[^/]+\/events\/?$/;

function extractGameId(path: string): string | undefined {
  return GAME_ID_REGEX.exec(path)?.[1];
}

function isStaticPath(path: string): boolean {
  return path.startsWith("/_fresh/") || path.startsWith("/static/");
}

const corsMiddleware = define.middleware(async (ctx) => {
  const response = await ctx.next();
  response.headers.set("Access-Control-Allow-Origin", APP_ORIGIN);
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
      logger.error("Unhandled error", { error });
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

  const start = Date.now();
  const response = await ctx.next();
  const duration = Date.now() - start;
  const status = response.status;
  const gameId = extractGameId(path);

  const data = { method, path, status, duration, gameId, body, clientIp };

  if (status >= 500) {
    logger.error("Request", data);
  } else if (status >= 400) {
    logger.warn("Request", data);
  } else {
    logger.info("Request", data);
  }

  return response;
});

const bodySizeMiddleware = define.middleware((ctx) => {
  const { method } = ctx.req;
  if (
    (method === "POST" || method === "PUT" || method === "PATCH") &&
    ctx.url.pathname.startsWith("/api/")
  ) {
    checkBodySize(ctx.req, MAX_BODY_BYTES);
  }
  return ctx.next();
});

const rateLimitMiddleware = define.middleware((ctx) => {
  const path = ctx.url.pathname;
  const method = ctx.req.method;

  if (!path.startsWith("/api/")) {
    return ctx.next();
  }

  const ip = extractClientIp(ctx.req);

  let allowed: boolean;
  if (method === "POST" && CREATE_GAME_PATH.test(path)) {
    allowed = createGameLimiter.isAllowed(ip);
  } else if (method === "POST" && SUBMIT_ACTION_PATH.test(path)) {
    allowed = submitActionLimiter.isAllowed(ip);
  } else if (method === "GET" && GET_EVENTS_PATH.test(path)) {
    allowed = getEventsLimiter.isAllowed(ip);
  } else {
    allowed = globalApiLimiter.isAllowed(ip);
  }

  if (!allowed) {
    throw new AppError("RateLimitError", 429, { path });
  }

  return ctx.next();
});

const diMiddleware = define.middleware((ctx) => {
  ctx.state.gameService = gameService;
  return ctx.next();
});

export const handler = [
  corsMiddleware,
  requestLoggingMiddleware,
  errorMiddleware,
  bodySizeMiddleware,
  rateLimitMiddleware,
  diMiddleware,
];
