import type { GameEvent as EngineGameEvent } from "@scoundrel/engine";
import type { PrismaClient } from "../generated/prisma/client.ts";

export type StoredEvent = {
  sequence: number;
  payload: EngineGameEvent;
};

export type GameRepository = {
  createGame(gameId: string, event: EngineGameEvent): Promise<void>;
  appendEvent(gameId: string, event: EngineGameEvent): Promise<void>;
  getLatestEvent(gameId: string): Promise<StoredEvent | null>;
  getAllEvents(gameId: string): Promise<StoredEvent[]>;
  updateStatus(
    gameId: string,
    status: string,
    score: number | null,
  ): Promise<void>;
};

export function createPrismaGameRepository(
  prisma: PrismaClient,
): GameRepository {
  return {
    async createGame(gameId: string, event: EngineGameEvent): Promise<void> {
      await prisma.$transaction(async (tx: PrismaClient) => {
        await tx.game.create({
          data: {
            id: gameId,
            status: "in_progress",
          },
        });
        await tx.gameEvent.create({
          data: {
            gameId,
            sequence: event.id,
            payload: event as unknown as Record<string, unknown>,
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
          payload: event as unknown as Record<string, unknown>,
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
  };
}
