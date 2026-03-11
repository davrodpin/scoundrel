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
};

export function createPrismaGameRepository(
  prisma: PrismaClient,
): GameRepository {
  return {
    async createGame(
      gameId: string,
      playerName: string,
      event: EngineGameEvent,
    ): Promise<void> {
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
    },

    async appendEvent(
      gameId: string,
      event: EngineGameEvent,
    ): Promise<void> {
      await prisma.gameEvent.create({
        data: {
          gameId,
          sequence: event.id,
          payload: event as unknown as Prisma.InputJsonValue,
        },
      });
    },

    async getLatestEvent(gameId: string): Promise<StoredEvent | null> {
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
    },

    async getAllEvents(gameId: string): Promise<StoredEvent[]> {
      const rows = await prisma.gameEvent.findMany({
        where: { gameId },
        orderBy: { sequence: "asc" },
        select: { sequence: true, payload: true },
      });

      return rows.map((row: { sequence: number; payload: unknown }) => ({
        sequence: row.sequence,
        payload: row.payload as unknown as EngineGameEvent,
      }));
    },

    async updateStatus(
      gameId: string,
      status: string,
      score: number | null,
    ): Promise<void> {
      await prisma.game.update({
        where: { id: gameId },
        data: { status, score },
      });
    },

    async getPlayerName(gameId: string): Promise<string | null> {
      const row = await prisma.game.findUnique({
        where: { id: gameId },
        select: { playerName: true },
      });
      if (!row) return null;
      return (row as { playerName: string }).playerName;
    },

    async getGameStatus(gameId: string): Promise<string | null> {
      const row = await prisma.game.findUnique({
        where: { id: gameId },
        select: { status: true },
      });
      if (!row) return null;
      return (row as { status: string }).status;
    },

    async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
      const rows = await prisma.game.findMany({
        where: { status: "completed", score: { not: null } },
        orderBy: { score: "desc" },
        take: limit,
        select: { id: true, playerName: true, score: true, updatedAt: true },
      });

      return rows.map(
        (row: {
          id: string;
          playerName: string;
          score: number | null;
          updatedAt: Date;
        }) => ({
          gameId: row.id,
          playerName: row.playerName,
          score: row.score!,
          completedAt: row.updatedAt.toISOString(),
        }),
      );
    },
  };
}
