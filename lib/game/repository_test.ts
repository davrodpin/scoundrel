import { assertEquals, assertExists } from "@std/assert";
import { createPrismaGameRepository } from "./repository.ts";
import type { GameRepository, StoredEvent } from "./repository.ts";
import type { PrismaClient } from "../generated/prisma/client.ts";
import type { GameEvent as EngineGameEvent } from "@scoundrel/engine";
import { createSpyTracer } from "../telemetry/testing.ts";

// deno-lint-ignore no-explicit-any
type MockPrisma = Record<string, any>;

function makeMockPrismaClient(): MockPrisma {
  return {
    $transaction: () => Promise.resolve(),
    game: {
      create: () => Promise.resolve(),
      update: () => Promise.resolve(),
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      deleteMany: () => Promise.resolve({ count: 0 }),
    },
    gameEvent: {
      create: () => Promise.resolve(),
      findFirst: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
    },
    leaderboardEntry: {
      findMany: () => Promise.resolve([]),
      findFirst: () => Promise.resolve(null),
      findUnique: () => Promise.resolve(null),
      upsert: () => Promise.resolve(),
      update: () => Promise.resolve(),
      count: () => Promise.resolve(0),
    },
  };
}

Deno.test("createPrismaGameRepository returns object with all repository methods", () => {
  const mockPrisma = makeMockPrismaClient();
  const repo: GameRepository = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );

  assertEquals(typeof repo.createGame, "function");
  assertEquals(typeof repo.appendEvent, "function");
  assertEquals(typeof repo.getLatestEvent, "function");
  assertEquals(typeof repo.getAllEvents, "function");
  assertEquals(typeof repo.updateStatus, "function");
  assertEquals(typeof repo.getPlayerName, "function");
  assertEquals(typeof repo.getGameStatus, "function");
  assertEquals(typeof repo.getLeaderboard, "function");
  assertEquals(typeof repo.getLeaderboardEntry, "function");
  assertEquals(typeof repo.createLeaderboardEntry, "function");
  assertEquals(typeof repo.deleteGamesOlderThan, "function");
});

Deno.test("createGame calls $transaction on prisma client", async () => {
  let transactionCalled = false;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.$transaction = async (fn: (tx: MockPrisma) => Promise<void>) => {
    transactionCalled = true;
    await fn({
      game: { create: () => Promise.resolve() },
      gameEvent: { create: () => Promise.resolve() },
    });
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );

  await repo.createGame("test-game-id", "TestPlayer", {
    kind: "game_created",
    id: 0,
    timestamp: "2026-03-08T00:00:00.000Z",
    gameId: "test-game-id",
    initialState: {} as never,
  });

  assertEquals(transactionCalled, true);
});

Deno.test("createGame passes playerName to game.create", async () => {
  let createdData: Record<string, unknown> | null = null;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.$transaction = async (fn: (tx: MockPrisma) => Promise<void>) => {
    await fn({
      game: {
        create: (args: { data: Record<string, unknown> }) => {
          createdData = args.data;
          return Promise.resolve();
        },
      },
      gameEvent: { create: () => Promise.resolve() },
    });
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );

  await repo.createGame("test-game-id", "TestPlayer", {
    kind: "game_created",
    id: 0,
    timestamp: "2026-03-08T00:00:00.000Z",
    gameId: "test-game-id",
    initialState: {} as never,
  });

  assertEquals(
    (createdData as unknown as Record<string, unknown>)?.playerName,
    "TestPlayer",
  );
});

Deno.test("appendEvent calls gameEvent.create with correct data", async () => {
  let createdData: Record<string, unknown> | null = null;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.gameEvent.create = (args: { data: Record<string, unknown> }) => {
    createdData = args.data;
    return Promise.resolve();
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );

  const event = {
    kind: "action_applied" as const,
    id: 3,
    timestamp: "2026-03-08T00:00:00.000Z",
    action: {} as never,
    stateAfter: {} as never,
  };

  await repo.appendEvent("test-game-id", event);

  assertEquals(createdData, {
    gameId: "test-game-id",
    sequence: 3,
    payload: event,
  });
});

Deno.test("getLatestEvent returns null when no events found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.gameEvent.findFirst = () => Promise.resolve(null);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getLatestEvent("test-game-id");

  assertEquals(result, null);
});

Deno.test("getLatestEvent returns StoredEvent when event exists", async () => {
  const payload: EngineGameEvent = {
    kind: "game_created",
    id: 0,
    timestamp: "2026-03-08T00:00:00.000Z",
    gameId: "test-game-id",
    initialState: {} as never,
  };
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.gameEvent.findFirst = () =>
    Promise.resolve({ sequence: 0, payload });

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getLatestEvent("test-game-id");

  const expected: StoredEvent = { sequence: 0, payload };
  assertEquals(result, expected);
});

Deno.test("getAllEvents returns events ordered by sequence", async () => {
  const event0: EngineGameEvent = {
    kind: "game_created",
    id: 0,
    timestamp: "2026-03-08T00:00:00.000Z",
    gameId: "test-game-id",
    initialState: {} as never,
  };
  const event1: EngineGameEvent = {
    kind: "action_applied",
    id: 1,
    timestamp: "2026-03-08T00:00:01.000Z",
    action: {} as never,
    stateAfter: {} as never,
  };
  const events = [
    { sequence: 0, payload: event0 },
    { sequence: 1, payload: event1 },
  ];
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.gameEvent.findMany = () => Promise.resolve(events);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getAllEvents("test-game-id");

  const expected: StoredEvent[] = [
    { sequence: 0, payload: event0 },
    { sequence: 1, payload: event1 },
  ];
  assertEquals(result, expected);
});

Deno.test("updateStatus calls game.update with correct data", async () => {
  let updateArgs: Record<string, unknown> | null = null;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.update = (args: Record<string, unknown>) => {
    updateArgs = args;
    return Promise.resolve();
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  await repo.updateStatus("test-game-id", "completed", 15);

  assertEquals(updateArgs, {
    where: { id: "test-game-id" },
    data: { status: "completed", score: 15 },
  });
});

Deno.test("updateStatus passes null score correctly", async () => {
  let updateArgs: Record<string, unknown> | null = null;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.update = (args: Record<string, unknown>) => {
    updateArgs = args;
    return Promise.resolve();
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  await repo.updateStatus("test-game-id", "in_progress", null);

  assertEquals(updateArgs, {
    where: { id: "test-game-id" },
    data: { status: "in_progress", score: null },
  });
});

Deno.test("getPlayerName returns null when game not found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () => Promise.resolve(null);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getPlayerName("non-existent");
  assertEquals(result, null);
});

Deno.test("getPlayerName returns playerName when game found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () =>
    Promise.resolve({ playerName: "TestHero" });

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getPlayerName("test-game-id");
  assertEquals(result, "TestHero");
});

Deno.test("getLeaderboard returns empty array when no leaderboard entries", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findMany = () => Promise.resolve([]);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getLeaderboard(25);
  assertEquals(result, []);
});

Deno.test("getGameStatus returns null when game not found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () => Promise.resolve(null);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getGameStatus("non-existent");
  assertEquals(result, null);
});

Deno.test("getGameStatus returns status when game found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () => Promise.resolve({ status: "completed" });

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getGameStatus("test-game-id");
  assertEquals(result, "completed");
});

Deno.test("getGameStatus returns in_progress status for active game", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () => Promise.resolve({ status: "in_progress" });

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getGameStatus("test-game-id");
  assertEquals(result, "in_progress");
});

Deno.test("getLeaderboard maps leaderboard_entries rows to LeaderboardEntry", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findMany = () =>
    Promise.resolve([
      {
        gameId: "game-1",
        playerName: "Alice",
        score: 20,
        completedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        gameId: "game-2",
        playerName: "Bob",
        score: 10,
        completedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getLeaderboard(25);

  assertEquals(result.length, 2);
  assertEquals(result[0].gameId, "game-1");
  assertEquals(result[0].playerName, "Alice");
  assertEquals(result[0].score, 20);
  assertEquals(result[0].completedAt, "2026-01-01T00:00:00.000Z");
  assertEquals(result[1].gameId, "game-2");
  assertEquals(result[1].score, 10);
});

Deno.test("getLeaderboardEntry returns null when entry not found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findUnique = () => Promise.resolve(null);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getLeaderboardEntry("non-existent-game-id");
  assertEquals(result, null);
});

Deno.test("getLeaderboardEntry returns LeaderboardEntry when found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findUnique = () =>
    Promise.resolve({
      gameId: "game-1",
      playerName: "Alice",
      score: 20,
      completedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const result = await repo.getLeaderboardEntry("game-1");

  assertEquals(result?.gameId, "game-1");
  assertEquals(result?.playerName, "Alice");
  assertEquals(result?.score, 20);
  assertEquals(result?.completedAt, "2026-01-01T00:00:00.000Z");
});

Deno.test("getLeaderboardRank returns rank 1 when no entries score higher", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.count = () => Promise.resolve(0);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const completedAt = new Date("2026-01-01T00:00:00.000Z");
  const result = await repo.getLeaderboardRank(10, completedAt);

  assertEquals(result.rank, 1);
});

Deno.test("getLeaderboardRank counts entries with higher score or same score and earlier completedAt", async () => {
  const mockPrisma = makeMockPrismaClient();
  const capturedWhereArgs: unknown[] = [];
  mockPrisma.leaderboardEntry.count = (args: { where?: unknown }) => {
    if (args?.where !== undefined) {
      capturedWhereArgs.push(args.where);
      return Promise.resolve(5);
    }
    return Promise.resolve(10);
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const completedAt = new Date("2026-01-15T00:00:00.000Z");
  const result = await repo.getLeaderboardRank(10, completedAt);

  assertEquals(result.rank, 6);
  assertEquals(result.totalEntries, 10);
  assertEquals(capturedWhereArgs.length, 1);
});

Deno.test("getLeaderboardRank returns totalEntries from total count", async () => {
  const mockPrisma = makeMockPrismaClient();
  let callCount = 0;
  mockPrisma.leaderboardEntry.count = (args: { where?: unknown }) => {
    callCount++;
    if (args?.where !== undefined) return Promise.resolve(2);
    return Promise.resolve(7);
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const completedAt = new Date("2026-01-01T00:00:00.000Z");
  const result = await repo.getLeaderboardRank(5, completedAt);

  assertEquals(result.totalEntries, 7);
  assertEquals(callCount, 2);
});

Deno.test("createLeaderboardEntry updates existing entry when playerName+score duplicate found", async () => {
  let upsertCalled = false;
  // deno-lint-ignore no-explicit-any
  let updateCalledWith: Record<string, any> | null = null;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findFirst = () => Promise.resolve({ id: 42 });
  mockPrisma.leaderboardEntry.upsert = () => {
    upsertCalled = true;
    return Promise.resolve();
  };
  // deno-lint-ignore no-explicit-any
  mockPrisma.leaderboardEntry.update = (args: Record<string, any>) => {
    updateCalledWith = args;
    return Promise.resolve();
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const completedAt = new Date("2026-01-15T12:00:00Z");
  await repo.createLeaderboardEntry(
    "new-game-id",
    "Alice",
    10,
    completedAt,
  );

  assertEquals(upsertCalled, false, "upsert should not be called for duplicates");
  assertExists(updateCalledWith, "update should have been called");
  assertEquals(updateCalledWith.where, { id: 42 });
  assertEquals(updateCalledWith.data, { gameId: "new-game-id", completedAt });
});

Deno.test("createLeaderboardEntry updates existing entry on P2002 race condition", async () => {
  // deno-lint-ignore no-explicit-any
  let updateCalledWith: Record<string, any> | null = null;
  let findFirstCallCount = 0;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findFirst = () => {
    findFirstCallCount++;
    if (findFirstCallCount === 1) return Promise.resolve(null);
    return Promise.resolve({ id: 99 });
  };
  mockPrisma.leaderboardEntry.upsert = () => {
    const err = new Error("Unique constraint failed") as Error & {
      code: string;
    };
    err.code = "P2002";
    return Promise.reject(err);
  };
  // deno-lint-ignore no-explicit-any
  mockPrisma.leaderboardEntry.update = (args: Record<string, any>) => {
    updateCalledWith = args;
    return Promise.resolve();
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  const completedAt = new Date("2026-01-15T12:00:00Z");
  await repo.createLeaderboardEntry(
    "race-game-id",
    "Alice",
    10,
    completedAt,
  );

  assertExists(updateCalledWith, "update should have been called after P2002");
  assertEquals(updateCalledWith.where, { id: 99 });
  assertEquals(updateCalledWith.data, {
    gameId: "race-game-id",
    completedAt,
  });
});

Deno.test("createLeaderboardEntry inserts when same playerName but different score", async () => {
  let upsertCalled = false;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findFirst = () => Promise.resolve(null);
  mockPrisma.leaderboardEntry.upsert = () => {
    upsertCalled = true;
    return Promise.resolve();
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  await repo.createLeaderboardEntry(
    "new-game-id",
    "Alice",
    20,
    new Date(),
  );

  assertEquals(upsertCalled, true);
});

Deno.test("createLeaderboardEntry inserts when same score but different playerName", async () => {
  let upsertCalled = false;
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findFirst = () => Promise.resolve(null);
  mockPrisma.leaderboardEntry.upsert = () => {
    upsertCalled = true;
    return Promise.resolve();
  };

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    createSpyTracer().tracer,
  );
  await repo.createLeaderboardEntry(
    "new-game-id",
    "Bob",
    10,
    new Date(),
  );

  assertEquals(upsertCalled, true);
});
