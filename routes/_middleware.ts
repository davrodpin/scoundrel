import { getLogger } from "@logtape/logtape";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { createGameEngine } from "@scoundrel/engine";
import {
  createGameService,
  createPrismaGameRepository,
} from "@scoundrel/game-service";
import { define } from "@/utils.ts";
import { captureRequestBody } from "./_middleware_helpers.ts";

const prisma = new PrismaClient();
const engine = createGameEngine();
const repository = createPrismaGameRepository(prisma);
const gameService = createGameService(engine, repository);

const logger = getLogger(["scoundrel", "http"]);

const GAME_ID_REGEX = /\/api\/games\/([^/]+)/;

function extractGameId(path: string): string | undefined {
  return GAME_ID_REGEX.exec(path)?.[1];
}

function isStaticPath(path: string): boolean {
  return path.startsWith("/_fresh/") || path.startsWith("/static/");
}

const errorMiddleware = define.middleware(async (ctx) => {
  try {
    return await ctx.next();
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number" &&
      error.status < 500
    ) {
      throw error;
    }
    const method = ctx.req.method;
    const path = ctx.url.pathname;
    const gameId = extractGameId(path);
    logger.error("Unhandled error", { method, path, error, gameId });
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
});

const requestLoggingMiddleware = define.middleware(async (ctx) => {
  const method = ctx.req.method;
  const path = ctx.url.pathname;

  if (isStaticPath(path)) {
    return ctx.next();
  }

  const body = await captureRequestBody(ctx.req, method, path);

  const start = Date.now();
  const response = await ctx.next();
  const duration = Date.now() - start;
  const status = response.status;
  const gameId = extractGameId(path);

  const data = { method, path, status, duration, gameId, body };

  if (status >= 500) {
    logger.error("Request", data);
  } else if (status >= 400) {
    logger.warn("Request", data);
  } else {
    logger.info("Request", data);
  }

  return response;
});

const diMiddleware = define.middleware((ctx) => {
  ctx.state.gameService = gameService;
  return ctx.next();
});

export const handler = [
  errorMiddleware,
  requestLoggingMiddleware,
  diMiddleware,
];
