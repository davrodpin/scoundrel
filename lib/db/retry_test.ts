import { assertEquals, assertRejects } from "@std/assert";
import {
  createResilientRepository,
  DEFAULT_RETRY_OPTIONS,
  isRetryableError,
  withRetry,
} from "./retry.ts";
import type { GameRepository, StoredEvent } from "@scoundrel/game-service";

// --- isRetryableError ---

Deno.test("isRetryableError — matches Connection terminated", () => {
  const err = new Error("Connection terminated due to connection timeout");
  assertEquals(
    isRetryableError(err, DEFAULT_RETRY_OPTIONS.retryableMessages),
    true,
  );
});

Deno.test("isRetryableError — matches connection timeout", () => {
  const err = new Error("connection timeout");
  assertEquals(
    isRetryableError(err, DEFAULT_RETRY_OPTIONS.retryableMessages),
    true,
  );
});

Deno.test("isRetryableError — matches Connection refused", () => {
  const err = new Error("Connection refused");
  assertEquals(
    isRetryableError(err, DEFAULT_RETRY_OPTIONS.retryableMessages),
    true,
  );
});

Deno.test("isRetryableError — matches ECONNRESET", () => {
  const err = new Error("read ECONNRESET");
  assertEquals(
    isRetryableError(err, DEFAULT_RETRY_OPTIONS.retryableMessages),
    true,
  );
});

Deno.test("isRetryableError — matches ETIMEDOUT", () => {
  const err = new Error("connect ETIMEDOUT");
  assertEquals(
    isRetryableError(err, DEFAULT_RETRY_OPTIONS.retryableMessages),
    true,
  );
});

Deno.test("isRetryableError — matches too many clients", () => {
  const err = new Error("sorry, too many clients already");
  assertEquals(
    isRetryableError(err, DEFAULT_RETRY_OPTIONS.retryableMessages),
    true,
  );
});

Deno.test("isRetryableError — returns false for Prisma P2002", () => {
  const err = new Error("Unique constraint failed on the fields: (`id`)");
  assertEquals(
    isRetryableError(err, DEFAULT_RETRY_OPTIONS.retryableMessages),
    false,
  );
});

Deno.test("isRetryableError — returns false for non-Error value", () => {
  assertEquals(
    isRetryableError("some string", DEFAULT_RETRY_OPTIONS.retryableMessages),
    false,
  );
  assertEquals(
    isRetryableError(null, DEFAULT_RETRY_OPTIONS.retryableMessages),
    false,
  );
  assertEquals(
    isRetryableError(42, DEFAULT_RETRY_OPTIONS.retryableMessages),
    false,
  );
});

// --- withRetry ---

Deno.test("withRetry — returns result on first success", async () => {
  const result = await withRetry(() => Promise.resolve(42));
  assertEquals(result, 42);
});

Deno.test("withRetry — retries on retryable error and succeeds", async () => {
  let calls = 0;
  const result = await withRetry(
    () => {
      calls++;
      if (calls < 2) throw new Error("Connection terminated");
      return Promise.resolve("ok");
    },
    DEFAULT_RETRY_OPTIONS,
    () => Promise.resolve(),
  );
  assertEquals(result, "ok");
  assertEquals(calls, 2);
});

Deno.test("withRetry — throws immediately on non-retryable error", async () => {
  let calls = 0;
  await assertRejects(
    () =>
      withRetry(
        () => {
          calls++;
          throw new Error("Unique constraint failed");
        },
        DEFAULT_RETRY_OPTIONS,
        () => Promise.resolve(),
      ),
    Error,
    "Unique constraint failed",
  );
  assertEquals(calls, 1);
});

Deno.test("withRetry — exhausts retries and throws last error", async () => {
  let calls = 0;
  await assertRejects(
    () =>
      withRetry(
        () => {
          calls++;
          throw new Error("Connection terminated");
        },
        { ...DEFAULT_RETRY_OPTIONS, maxRetries: 3 },
        () => Promise.resolve(),
      ),
    Error,
    "Connection terminated",
  );
  // initial attempt + 3 retries = 4 calls
  assertEquals(calls, 4);
});

Deno.test("withRetry — calls delayFn between retries", async () => {
  const delays: number[] = [];
  let calls = 0;
  await withRetry(
    () => {
      calls++;
      if (calls < 3) throw new Error("ETIMEDOUT");
      return Promise.resolve("done");
    },
    {
      ...DEFAULT_RETRY_OPTIONS,
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 2000,
    },
    (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    },
  );
  // 2 failures → 2 delays
  assertEquals(delays.length, 2);
  // each delay is between 0 and maxDelayMs
  for (const d of delays) {
    assertEquals(d >= 0, true);
    assertEquals(d <= 2000, true);
  }
});

// --- createResilientRepository ---

function makeStubRepo(overrides: Partial<GameRepository> = {}): GameRepository {
  const stub: GameRepository = {
    createGame: () => Promise.resolve(),
    appendEvent: () => Promise.resolve(),
    appendEvents: () => Promise.resolve(),
    getLatestEvent: () => Promise.resolve(null),
    getAllEvents: () => Promise.resolve([]),
    updateStatus: () => Promise.resolve(),
    getPlayerName: () => Promise.resolve(null),
    getGameStatus: () => Promise.resolve(null),
    getLeaderboard: () => Promise.resolve([]),
    getLeaderboardEntry: () => Promise.resolve(null),
    getLeaderboardRank: () => Promise.resolve({ rank: 1, totalEntries: 1 }),
    createLeaderboardEntry: () => Promise.resolve(),
    deleteGamesOlderThan: () => Promise.resolve(0),
    countGamesByStatus: () => Promise.resolve({ inProgress: 0, completed: 0 }),
    ...overrides,
  };
  return stub;
}

Deno.test("createResilientRepository — has all GameRepository methods", () => {
  const resilient = createResilientRepository(makeStubRepo());
  const methods: (keyof GameRepository)[] = [
    "createGame",
    "appendEvent",
    "appendEvents",
    "getLatestEvent",
    "getAllEvents",
    "updateStatus",
    "getPlayerName",
    "getGameStatus",
    "getLeaderboard",
    "getLeaderboardEntry",
    "getLeaderboardRank",
    "createLeaderboardEntry",
    "deleteGamesOlderThan",
    "countGamesByStatus",
  ];
  for (const method of methods) {
    assertEquals(typeof resilient[method], "function");
  }
});

Deno.test("createResilientRepository — delegates to inner repository", async () => {
  const events: StoredEvent[] = [{
    sequence: 1,
    payload: { kind: "game_started" } as never,
  }];
  const stub = makeStubRepo({ getAllEvents: () => Promise.resolve(events) });
  const resilient = createResilientRepository(stub);
  const result = await resilient.getAllEvents("game-1");
  assertEquals(result, events);
});

Deno.test("createResilientRepository — retries on connection error for createGame", async () => {
  let calls = 0;
  const stub = makeStubRepo({
    createGame: () => {
      calls++;
      if (calls < 2) throw new Error("Connection terminated");
      return Promise.resolve();
    },
  });
  const resilient = createResilientRepository(
    stub,
    { ...DEFAULT_RETRY_OPTIONS, maxRetries: 3 },
    () => Promise.resolve(),
  );
  await resilient.createGame("g1", "Alice", { kind: "game_started" } as never);
  assertEquals(calls, 2);
});
