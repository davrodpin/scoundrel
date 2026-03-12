// Integration tests for GameRepository — run against a real database.
// Requires DATABASE_URL to be set in the environment.

import { assertEquals } from "@std/assert";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { createPrismaGameRepository } from "../repository.ts";

const { Pool } = pg;

function createTestClients(): { prisma: PrismaClient; pool: pg.Pool } {
  const connectionString = Deno.env.get("DATABASE_URL");
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required for integration tests",
    );
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient(
    { adapter } as never,
  ) as unknown as PrismaClient;
  return { prisma, pool };
}

Deno.test("createLeaderboardEntry — creates an entry and it can be queried back", async () => {
  const { prisma, pool } = createTestClients();
  const repo = createPrismaGameRepository(prisma);

  const gameId = crypto.randomUUID();
  const playerName = "Integration Tester";
  const score = 42;
  const completedAt = new Date("2026-01-01T12:00:00.000Z");

  // First create a game so foreign key constraint is satisfied
  await (prisma as unknown as {
    game: { create: (args: unknown) => Promise<unknown> };
  }).game.create({
    data: { id: gameId, status: "completed", playerName, score },
  });

  try {
    await repo.createLeaderboardEntry(gameId, playerName, score, completedAt);

    const entries = await repo.getLeaderboard(100);
    const entry = entries.find((e) => e.gameId === gameId);

    assertEquals(entry?.gameId, gameId);
    assertEquals(entry?.playerName, playerName);
    assertEquals(entry?.score, score);
    assertEquals(entry?.completedAt, "2026-01-01T12:00:00.000Z");
  } finally {
    // Clean up
    await (prisma as unknown as {
      leaderboardEntry: { deleteMany: (args: unknown) => Promise<unknown> };
      game: { deleteMany: (args: unknown) => Promise<unknown> };
    }).leaderboardEntry.deleteMany({ where: { gameId } });
    await (prisma as unknown as {
      game: { deleteMany: (args: unknown) => Promise<unknown> };
    }).game.deleteMany({ where: { id: gameId } });
    await (prisma as unknown as { $disconnect: () => Promise<void> })
      .$disconnect();
    await pool.end();
  }
});

Deno.test("createLeaderboardEntry upsert — calling twice with same gameId does not create duplicate", async () => {
  const { prisma, pool } = createTestClients();
  const repo = createPrismaGameRepository(prisma);

  const gameId = crypto.randomUUID();
  const playerName = "Upsert Tester";
  const score = 55;
  const completedAt = new Date("2026-02-01T12:00:00.000Z");

  await (prisma as unknown as {
    game: { create: (args: unknown) => Promise<unknown> };
  }).game.create({
    data: { id: gameId, status: "completed", playerName, score },
  });

  try {
    await repo.createLeaderboardEntry(gameId, playerName, score, completedAt);
    // Call again with updated score
    await repo.createLeaderboardEntry(gameId, playerName, 99, completedAt);

    const entries = await repo.getLeaderboard(100);
    const matching = entries.filter((e) => e.gameId === gameId);

    // Should only have one entry
    assertEquals(matching.length, 1);
    // Score should be the updated one
    assertEquals(matching[0].score, 99);
  } finally {
    await (prisma as unknown as {
      leaderboardEntry: { deleteMany: (args: unknown) => Promise<unknown> };
      game: { deleteMany: (args: unknown) => Promise<unknown> };
    }).leaderboardEntry.deleteMany({ where: { gameId } });
    await (prisma as unknown as {
      game: { deleteMany: (args: unknown) => Promise<unknown> };
    }).game.deleteMany({ where: { id: gameId } });
    await (prisma as unknown as { $disconnect: () => Promise<void> })
      .$disconnect();
    await pool.end();
  }
});

Deno.test("getLeaderboard — returns entries ordered by score desc and respects limit", async () => {
  const { prisma, pool } = createTestClients();
  const repo = createPrismaGameRepository(prisma);

  const gameId1 = crypto.randomUUID();
  const gameId2 = crypto.randomUUID();
  const gameId3 = crypto.randomUUID();
  const completedAt = new Date("2026-03-01T00:00:00.000Z");

  // Create games
  await (prisma as unknown as {
    game: { create: (args: unknown) => Promise<unknown> };
  }).game.create({
    data: { id: gameId1, status: "completed", playerName: "Alpha", score: 10 },
  });
  await (prisma as unknown as {
    game: { create: (args: unknown) => Promise<unknown> };
  }).game.create({
    data: { id: gameId2, status: "completed", playerName: "Beta", score: 30 },
  });
  await (prisma as unknown as {
    game: { create: (args: unknown) => Promise<unknown> };
  }).game.create({
    data: { id: gameId3, status: "completed", playerName: "Gamma", score: 20 },
  });

  try {
    await repo.createLeaderboardEntry(gameId1, "Alpha", 10, completedAt);
    await repo.createLeaderboardEntry(gameId2, "Beta", 30, completedAt);
    await repo.createLeaderboardEntry(gameId3, "Gamma", 20, completedAt);

    // Get top 2
    const top2 = await repo.getLeaderboard(2);

    // Results must include only top 2 by score desc among all entries
    // Filter to our test entries
    const ourEntries = top2.filter(
      (e) =>
        e.gameId === gameId1 || e.gameId === gameId2 || e.gameId === gameId3,
    );

    // The top 2 overall might not include all 3 — but gameId2 (score 30) should be first
    // if it appears
    const hasGameId2 = top2.some((e) => e.gameId === gameId2);
    if (hasGameId2) {
      const idx2 = top2.findIndex((e) => e.gameId === gameId2);
      const idxGamma = top2.findIndex((e) => e.gameId === gameId3);
      if (idxGamma !== -1) {
        assertEquals(idx2 < idxGamma, true);
      }
    }

    // Verify results are ordered by score descending
    for (let i = 0; i < top2.length - 1; i++) {
      assertEquals(top2[i].score >= top2[i + 1].score, true);
    }

    // Limit is respected
    assertEquals(top2.length <= 2, true);

    // Verify ourEntries ordering among themselves
    const sortedOurs = [...ourEntries].sort((a, b) => b.score - a.score);
    for (let i = 0; i < ourEntries.length; i++) {
      assertEquals(ourEntries[i].score, sortedOurs[i].score);
    }
  } finally {
    await (prisma as unknown as {
      leaderboardEntry: { deleteMany: (args: unknown) => Promise<unknown> };
    }).leaderboardEntry.deleteMany({
      where: { gameId: { in: [gameId1, gameId2, gameId3] } },
    });
    await (prisma as unknown as {
      game: { deleteMany: (args: unknown) => Promise<unknown> };
    }).game.deleteMany({ where: { id: { in: [gameId1, gameId2, gameId3] } } });
    await (prisma as unknown as { $disconnect: () => Promise<void> })
      .$disconnect();
    await pool.end();
  }
});

Deno.test("deleteGamesOlderThan — deletes old games and returns correct count", async () => {
  const { prisma, pool } = createTestClients();
  const repo = createPrismaGameRepository(prisma);

  const oldGameId = crypto.randomUUID();
  const newGameId = crypto.randomUUID();
  const cutoffDate = new Date("2025-01-01T00:00:00.000Z");
  const oldDate = new Date("2024-01-01T00:00:00.000Z");

  // Create a game that's "old" by setting createdAt in the past
  await (prisma as unknown as {
    game: {
      create: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
    };
  }).game.create({
    data: { id: oldGameId, status: "in_progress", playerName: "OldPlayer" },
  });
  // Update the createdAt to a past date via raw update
  await (prisma as unknown as {
    $executeRaw: (...args: unknown[]) => Promise<unknown>;
  }).$executeRaw`UPDATE games SET created_at = ${oldDate} WHERE id = ${oldGameId}`;

  // Create a new game that should NOT be deleted
  await (prisma as unknown as {
    game: { create: (args: unknown) => Promise<unknown> };
  }).game.create({
    data: { id: newGameId, status: "in_progress", playerName: "NewPlayer" },
  });

  try {
    const deletedCount = await repo.deleteGamesOlderThan(cutoffDate);

    // At least the old game should have been deleted
    assertEquals(deletedCount >= 1, true);

    // Verify old game is gone
    const oldGameStatus = await repo.getGameStatus(oldGameId);
    assertEquals(oldGameStatus, null);

    // Verify new game still exists
    const newGameStatus = await repo.getGameStatus(newGameId);
    assertEquals(newGameStatus, "in_progress");
  } finally {
    // Clean up (oldGameId may already be deleted)
    await (prisma as unknown as {
      game: { deleteMany: (args: unknown) => Promise<unknown> };
    }).game.deleteMany({ where: { id: { in: [oldGameId, newGameId] } } });
    await (prisma as unknown as { $disconnect: () => Promise<void> })
      .$disconnect();
    await pool.end();
  }
});
