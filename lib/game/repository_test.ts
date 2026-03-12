import { assertEquals } from "@std/assert";
import { createPrismaGameRepository } from "./repository.ts";
import type { GameRepository, StoredEvent } from "./repository.ts";
import type { PrismaClient } from "../generated/prisma/client.ts";
import type { GameEvent as EngineGameEvent } from "@scoundrel/engine";

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
      upsert: () => Promise.resolve(),
    },
  };
}

Deno.test("createPrismaGameRepository returns object with all repository methods", () => {
  const mockPrisma = makeMockPrismaClient();
  const repo: GameRepository = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
  );

  assertEquals(typeof repo.createGame, "function");
  assertEquals(typeof repo.appendEvent, "function");
  assertEquals(typeof repo.getLatestEvent, "function");
  assertEquals(typeof repo.getAllEvents, "function");
  assertEquals(typeof repo.updateStatus, "function");
  assertEquals(typeof repo.getPlayerName, "function");
  assertEquals(typeof repo.getGameStatus, "function");
  assertEquals(typeof repo.getLeaderboard, "function");
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
  );
  const result = await repo.getPlayerName("test-game-id");
  assertEquals(result, "TestHero");
});

Deno.test("getLeaderboard returns empty array when no leaderboard entries", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.leaderboardEntry.findMany = () => Promise.resolve([]);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
  );
  const result = await repo.getLeaderboard(25);
  assertEquals(result, []);
});

Deno.test("getGameStatus returns null when game not found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () => Promise.resolve(null);

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
  );
  const result = await repo.getGameStatus("non-existent");
  assertEquals(result, null);
});

Deno.test("getGameStatus returns status when game found", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () => Promise.resolve({ status: "completed" });

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
  );
  const result = await repo.getGameStatus("test-game-id");
  assertEquals(result, "completed");
});

Deno.test("getGameStatus returns in_progress status for active game", async () => {
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.findUnique = () => Promise.resolve({ status: "in_progress" });

  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
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
