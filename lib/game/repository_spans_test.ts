import { assertEquals } from "@std/assert";
import { createPrismaGameRepository } from "./repository.ts";
import type { PrismaClient } from "../generated/prisma/client.ts";
import { createSpyTracer } from "../telemetry/testing.ts";
import { SpanStatusCode } from "npm:@opentelemetry/api@1";

// deno-lint-ignore no-explicit-any
type MockPrisma = Record<string, any>;

function makeMockPrismaClient(): MockPrisma {
  return {
    $transaction: (_fn: (tx: MockPrisma) => Promise<void>) => Promise.resolve(),
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
    },
  };
}

const DUMMY_EVENT = {
  kind: "game_created" as const,
  id: 0,
  timestamp: "2026-03-13T00:00:00.000Z",
  gameId: "test-game-id",
  initialState: {} as never,
};

Deno.test("createGame creates a span named db.createGame", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.$transaction = async (fn: (tx: MockPrisma) => Promise<void>) => {
    await fn({
      game: { create: () => Promise.resolve() },
      gameEvent: { create: () => Promise.resolve() },
    });
  };
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.createGame("test-game-id", "TestPlayer", DUMMY_EVENT);

  const spans = getSpans();
  assertEquals(spans[0].name, "db.createGame");
  assertEquals(spans[0].ended, true);
});

Deno.test("createGame span sets db.system and game.id attributes", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.$transaction = async (fn: (tx: MockPrisma) => Promise<void>) => {
    await fn({
      game: { create: () => Promise.resolve() },
      gameEvent: { create: () => Promise.resolve() },
    });
  };
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.createGame("test-game-id", "TestPlayer", DUMMY_EVENT);

  const spans = getSpans();
  assertEquals(spans[0].attributes["db.system"], "postgresql");
  assertEquals(spans[0].attributes["db.operation"], "transaction");
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
});

Deno.test("appendEvent creates a span named db.appendEvent", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.appendEvent("test-game-id", DUMMY_EVENT);

  const spans = getSpans();
  assertEquals(spans[0].name, "db.appendEvent");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["db.operation"], "create");
});

Deno.test("getLatestEvent creates a span named db.getLatestEvent", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.getLatestEvent("test-game-id");

  const spans = getSpans();
  assertEquals(spans[0].name, "db.getLatestEvent");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["db.operation"], "findFirst");
});

Deno.test("getAllEvents creates a span named db.getAllEvents", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.getAllEvents("test-game-id");

  const spans = getSpans();
  assertEquals(spans[0].name, "db.getAllEvents");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["db.operation"], "findMany");
});

Deno.test("updateStatus creates a span named db.updateStatus", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.updateStatus("test-game-id", "completed", 15);

  const spans = getSpans();
  assertEquals(spans[0].name, "db.updateStatus");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["game.status"], "completed");
  assertEquals(spans[0].attributes["db.operation"], "update");
});

Deno.test("getPlayerName creates a span named db.getPlayerName", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.getPlayerName("test-game-id");

  const spans = getSpans();
  assertEquals(spans[0].name, "db.getPlayerName");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["db.operation"], "findUnique");
});

Deno.test("getGameStatus creates a span named db.getGameStatus", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.getGameStatus("test-game-id");

  const spans = getSpans();
  assertEquals(spans[0].name, "db.getGameStatus");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["db.operation"], "findUnique");
});

Deno.test("getLeaderboard creates a span named db.getLeaderboard", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.getLeaderboard(10);

  const spans = getSpans();
  assertEquals(spans[0].name, "db.getLeaderboard");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["db.operation"], "findMany");
  assertEquals(spans[0].attributes["db.limit"], 10);
});

Deno.test("getLeaderboardEntry creates a span named db.getLeaderboardEntry", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.getLeaderboardEntry("test-game-id");

  const spans = getSpans();
  assertEquals(spans[0].name, "db.getLeaderboardEntry");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["db.operation"], "findUnique");
});

Deno.test("createLeaderboardEntry creates a span named db.createLeaderboardEntry", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.createLeaderboardEntry("test-game-id", "Hero", 20, new Date());

  const spans = getSpans();
  assertEquals(spans[0].name, "db.createLeaderboardEntry");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["game.id"], "test-game-id");
  assertEquals(spans[0].attributes["db.operation"], "upsert");
});

Deno.test("deleteGamesOlderThan creates a span named db.deleteGamesOlderThan", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.game.deleteMany = () => Promise.resolve({ count: 3 });
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  await repo.deleteGamesOlderThan(new Date());

  const spans = getSpans();
  assertEquals(spans[0].name, "db.deleteGamesOlderThan");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].attributes["db.operation"], "deleteMany");
  assertEquals(spans[0].attributes["deleted.count"], 3);
});

Deno.test("repository span records error and sets ERROR status on failure", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const mockPrisma = makeMockPrismaClient();
  mockPrisma.gameEvent.findFirst = () => Promise.reject(new Error("DB error"));
  const repo = createPrismaGameRepository(
    mockPrisma as unknown as PrismaClient,
    tracer,
  );

  try {
    await repo.getLatestEvent("test-game-id");
  } catch {
    // expected
  }

  const spans = getSpans();
  assertEquals(spans[0].name, "db.getLatestEvent");
  assertEquals(spans[0].ended, true);
  assertEquals(spans[0].status.code, SpanStatusCode.ERROR);
  assertEquals(spans[0].error instanceof Error, true);
});
