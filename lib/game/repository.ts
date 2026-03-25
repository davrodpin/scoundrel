import { SpanStatusCode } from "@opentelemetry/api";
import type { Tracer } from "@opentelemetry/api";
import type { GameEvent as EngineGameEvent } from "@scoundrel/engine";
import type { Prisma, PrismaClient } from "../generated/prisma/client.ts";
import type { LeaderboardEntry } from "./types.ts";

export type StoredEvent = {
  sequence: number;
  payload: EngineGameEvent;
};

export type GameRepository = {
  createGame(
    gameId: string,
    playerName: string,
    event: EngineGameEvent,
  ): Promise<void>;
  appendEvent(gameId: string, event: EngineGameEvent): Promise<void>;
  getLatestEvent(gameId: string): Promise<StoredEvent | null>;
  getAllEvents(gameId: string): Promise<StoredEvent[]>;
  updateStatus(
    gameId: string,
    status: string,
    score: number | null,
  ): Promise<void>;
  getPlayerName(gameId: string): Promise<string | null>;
  getGameStatus(gameId: string): Promise<string | null>;
  getLeaderboard(limit: number): Promise<LeaderboardEntry[]>;
  getLeaderboardEntry(gameId: string): Promise<LeaderboardEntry | null>;
  getLeaderboardRank(
    score: number,
    completedAt: Date,
  ): Promise<{ rank: number; totalEntries: number }>;
  createLeaderboardEntry(
    gameId: string,
    playerName: string,
    score: number,
    completedAt: Date,
  ): Promise<void>;
  deleteGamesOlderThan(cutoffDate: Date): Promise<number>;
};

function withSpan<T>(
  tracer: Tracer,
  name: string,
  attrs: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    span.setAttributes(attrs);
    try {
      return await fn();
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  }) as Promise<T>;
}

export function createPrismaGameRepository(
  prisma: PrismaClient,
  tracer: Tracer,
): GameRepository {
  return {
    createGame(
      gameId: string,
      playerName: string,
      event: EngineGameEvent,
    ): Promise<void> {
      return withSpan(tracer, "db.createGame", {
        "db.system": "postgresql",
        "db.operation": "transaction",
        "game.id": gameId,
      }, async () => {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.game.create({
            data: {
              id: gameId,
              status: "in_progress",
              playerName,
            },
          });
          await tx.gameEvent.create({
            data: {
              gameId,
              sequence: event.id,
              payload: event as unknown as Prisma.InputJsonValue,
            },
          });
        });
      });
    },

    appendEvent(gameId: string, event: EngineGameEvent): Promise<void> {
      return withSpan(tracer, "db.appendEvent", {
        "db.operation": "create",
        "game.id": gameId,
        "event.sequence": event.id,
      }, async () => {
        await prisma.gameEvent.create({
          data: {
            gameId,
            sequence: event.id,
            payload: event as unknown as Prisma.InputJsonValue,
          },
        });
      });
    },

    getLatestEvent(gameId: string): Promise<StoredEvent | null> {
      return withSpan(tracer, "db.getLatestEvent", {
        "db.operation": "findFirst",
        "game.id": gameId,
      }, async () => {
        const row = await prisma.gameEvent.findFirst({
          where: { gameId },
          orderBy: { sequence: "desc" },
          select: { sequence: true, payload: true },
        });

        if (!row) return null;

        return {
          sequence: row.sequence,
          payload: row.payload as unknown as EngineGameEvent,
        };
      });
    },

    getAllEvents(gameId: string): Promise<StoredEvent[]> {
      return withSpan(tracer, "db.getAllEvents", {
        "db.operation": "findMany",
        "game.id": gameId,
      }, async () => {
        const rows = await prisma.gameEvent.findMany({
          where: { gameId },
          orderBy: { sequence: "asc" },
          select: { sequence: true, payload: true },
        });

        return rows.map((row: { sequence: number; payload: unknown }) => ({
          sequence: row.sequence,
          payload: row.payload as unknown as EngineGameEvent,
        }));
      });
    },

    updateStatus(
      gameId: string,
      status: string,
      score: number | null,
    ): Promise<void> {
      return withSpan(tracer, "db.updateStatus", {
        "db.operation": "update",
        "game.id": gameId,
        "game.status": status,
      }, async () => {
        await prisma.game.update({
          where: { id: gameId },
          data: { status, score },
        });
      });
    },

    getPlayerName(gameId: string): Promise<string | null> {
      return withSpan(tracer, "db.getPlayerName", {
        "db.operation": "findUnique",
        "game.id": gameId,
      }, async () => {
        const row = await prisma.game.findUnique({
          where: { id: gameId },
          select: { playerName: true },
        });
        if (!row) return null;
        return (row as { playerName: string }).playerName;
      });
    },

    getGameStatus(gameId: string): Promise<string | null> {
      return withSpan(tracer, "db.getGameStatus", {
        "db.operation": "findUnique",
        "game.id": gameId,
      }, async () => {
        const row = await prisma.game.findUnique({
          where: { id: gameId },
          select: { status: true },
        });
        if (!row) return null;
        return (row as { status: string }).status;
      });
    },

    getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
      return withSpan(tracer, "db.getLeaderboard", {
        "db.operation": "findMany",
        "db.limit": limit,
      }, async () => {
        const rows = await prisma.leaderboardEntry.findMany({
          orderBy: [{ score: "desc" }, { completedAt: "asc" }],
          take: limit,
          select: {
            gameId: true,
            playerName: true,
            score: true,
            completedAt: true,
          },
        });

        return rows.map(
          (
            row: {
              gameId: string;
              playerName: string;
              score: number;
              completedAt: Date;
            },
          ) => ({
            gameId: row.gameId,
            playerName: row.playerName,
            score: row.score,
            completedAt: row.completedAt.toISOString(),
          }),
        );
      });
    },

    getLeaderboardEntry(gameId: string): Promise<LeaderboardEntry | null> {
      return withSpan(tracer, "db.getLeaderboardEntry", {
        "db.operation": "findUnique",
        "game.id": gameId,
      }, async () => {
        const row = await prisma.leaderboardEntry.findUnique({
          where: { gameId },
          select: {
            gameId: true,
            playerName: true,
            score: true,
            completedAt: true,
          },
        });
        if (!row) return null;
        const typed = row as {
          gameId: string;
          playerName: string;
          score: number;
          completedAt: Date;
        };
        return {
          gameId: typed.gameId,
          playerName: typed.playerName,
          score: typed.score,
          completedAt: typed.completedAt.toISOString(),
        };
      });
    },

    getLeaderboardRank(
      score: number,
      completedAt: Date,
    ): Promise<{ rank: number; totalEntries: number }> {
      return withSpan(tracer, "db.getLeaderboardRank", {
        "db.operation": "count",
        "leaderboard.score": score,
      }, async () => {
        const [above, total] = await Promise.all([
          prisma.leaderboardEntry.count({
            where: {
              OR: [
                { score: { gt: score } },
                { score: { equals: score }, completedAt: { lt: completedAt } },
              ],
            },
          }),
          prisma.leaderboardEntry.count(),
        ]);
        return { rank: above + 1, totalEntries: total };
      });
    },

    createLeaderboardEntry(
      gameId: string,
      playerName: string,
      score: number,
      completedAt: Date,
    ): Promise<void> {
      return withSpan(tracer, "db.createLeaderboardEntry", {
        "db.operation": "upsert",
        "game.id": gameId,
      }, async () => {
        const duplicate = await prisma.leaderboardEntry.findFirst({
          where: { playerName, score },
          select: { id: true },
        });
        if (duplicate) {
          await prisma.leaderboardEntry.update({
            where: { id: duplicate.id },
            data: { gameId, completedAt },
          });
          return;
        }
        try {
          await prisma.leaderboardEntry.upsert({
            where: { gameId },
            create: { gameId, playerName, score, completedAt },
            update: { playerName, score, completedAt },
          });
        } catch (err) {
          if ((err as { code?: string }).code === "P2002") {
            const existing = await prisma.leaderboardEntry.findFirst({
              where: { playerName, score },
              select: { id: true },
            });
            if (existing) {
              await prisma.leaderboardEntry.update({
                where: { id: existing.id },
                data: { gameId, completedAt },
              });
            }
            return;
          }
          throw err;
        }
      });
    },

    deleteGamesOlderThan(cutoffDate: Date): Promise<number> {
      return tracer.startActiveSpan("db.deleteGamesOlderThan", async (span) => {
        span.setAttribute("db.operation", "deleteMany");
        try {
          const result = await prisma.game.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
          });
          span.setAttribute("deleted.count", result.count);
          return result.count;
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          span.end();
        }
      }) as Promise<number>;
    },
  };
}
