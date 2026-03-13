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
import { config } from "@scoundrel/config";
import { define } from "@/utils.ts";
import {
  captureRequestBody,
  checkBodySize,
  extractClientIp,
  extractErrorInfo,
  extractErrorStatus,
  toErrorResponse,
} from "./_middleware_helpers.ts";

const pool = new pg.Pool({ connectionString: config.db.url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const engine = createGameEngine();
const repository = createPrismaGameRepository(prisma);
const gameService = createGameService(engine, repository, {
  defaultPlayerName: config.game.defaultPlayerName,
});

const logger = getLogger(["scoundrel", "http"]);

const cleanupService = createCleanupService(repository, {
  retentionDays: config.cleanup.retentionDays,
});

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

  const start = Date.now();
  let response: Response;
  try {
    response = await ctx.next();
  } catch (error) {
    const duration = Date.now() - start;
    const status = extractErrorStatus(error);
    const gameId = extractGameId(path);
    logger.error("Request", {
      method,
      path,
      status,
      duration,
      gameId,
      body,
      clientIp,
      ...extractErrorInfo(error),
    });
    throw error;
  }
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
    checkBodySize(ctx.req, config.app.maxBodyBytes);
  }
  return ctx.next();
});

const diMiddleware = define.middleware((ctx) => {
  ctx.state.config = config;
  ctx.state.gameService = gameService;
  return ctx.next();
});

export const handler = [
  corsMiddleware,
  errorMiddleware,
  bodySizeMiddleware,
  requestLoggingMiddleware,
  diMiddleware,
];
