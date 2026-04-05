import { assertEquals, assertLess, assertRejects } from "@std/assert";
import { configure, type LogRecord } from "@logtape/logtape";
import { AppError } from "@scoundrel/errors";
import { createSpyTracer } from "../telemetry/testing.ts";
import type {
  ActionAppliedEvent,
  EventLog,
  GameAction,
  GameCreatedEvent,
  GameEngine,
  GameEvent as EngineGameEvent,
  GameState,
} from "@scoundrel/engine";
import type { GameRepository, StoredEvent } from "./repository.ts";
import { createGameService, type GameServiceConfig } from "./service.ts";

const TEST_CONFIG: GameServiceConfig = {
  defaultPlayerName: "Anonymous",
  leaderboardLimit: 25,
};

function makeInitialState(
  gameId = "00000000-0000-0000-0000-000000000001",
): GameState {
  return {
    gameId,
    health: 20,
    dungeon: [
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
      { suit: "clubs", rank: 3 },
      { suit: "spades", rank: 7 },
    ],
    room: [],
    discard: [],
    equippedWeapon: null,
    phase: { kind: "drawing" },
    lastRoomAvoided: false,
    turnNumber: 1,
    lastCardPlayed: null,
  };
}

function makeCreatedEvent(state: GameState): GameCreatedEvent {
  return {
    kind: "game_created",
    id: 0,
    timestamp: new Date().toISOString(),
    gameId: state.gameId,
    initialState: state,
  };
}

function makeActionAppliedEvent(
  id: number,
  action: GameAction,
  stateAfter: GameState,
): ActionAppliedEvent {
  return {
    kind: "action_applied",
    id,
    timestamp: new Date().toISOString(),
    action,
    stateAfter,
  };
}

function createMockRepository(
  storedEvents: Map<string, StoredEvent[]> = new Map(),
): GameRepository {
  const playerNames = new Map<string, string>();
  const statuses = new Map<string, string>();
  return {
    createGame(
      gameId: string,
      playerName: string,
      event: EngineGameEvent,
    ): Promise<void> {
      playerNames.set(gameId, playerName);
      statuses.set(gameId, "in_progress");
      storedEvents.set(gameId, [{ sequence: event.id, payload: event }]);
      return Promise.resolve();
    },
    appendEvent(gameId: string, event: EngineGameEvent): Promise<void> {
      const events = storedEvents.get(gameId) ?? [];
      events.push({ sequence: event.id, payload: event });
      storedEvents.set(gameId, events);
      return Promise.resolve();
    },
    appendEvents(
      gameId: string,
      newEvents: readonly EngineGameEvent[],
    ): Promise<void> {
      const events = storedEvents.get(gameId) ?? [];
      for (const event of newEvents) {
        events.push({ sequence: event.id, payload: event });
      }
      storedEvents.set(gameId, events);
      return Promise.resolve();
    },
    getLatestEvent(gameId: string): Promise<StoredEvent | null> {
      const events = storedEvents.get(gameId);
      if (!events || events.length === 0) return Promise.resolve(null);
      return Promise.resolve(events[events.length - 1]);
    },
    getAllEvents(gameId: string): Promise<StoredEvent[]> {
      return Promise.resolve(storedEvents.get(gameId) ?? []);
    },
    updateStatus(
      gameId: string,
      status: string,
      _score: number | null,
    ): Promise<void> {
      statuses.set(gameId, status);
      return Promise.resolve();
    },
    getPlayerName(gameId: string): Promise<string | null> {
      return Promise.resolve(playerNames.get(gameId) ?? null);
    },
    getGameStatus(gameId: string): Promise<string | null> {
      return Promise.resolve(statuses.get(gameId) ?? null);
    },
    getLeaderboard(_limit: number) {
      return Promise.resolve([]);
    },
    getLeaderboardEntry(_gameId: string) {
      return Promise.resolve(null);
    },
    getLeaderboardRank(_score: number, _completedAt: Date) {
      return Promise.resolve({ rank: 1, totalEntries: 1 });
    },
    createLeaderboardEntry(
      _gameId: string,
      _playerName: string,
      _score: number,
      _completedAt: Date,
    ): Promise<void> {
      return Promise.resolve();
    },
    deleteGamesOlderThan(_cutoffDate: Date): Promise<number> {
      return Promise.resolve(0);
    },
    countGamesByStatus(): Promise<{ inProgress: number; completed: number }> {
      return Promise.resolve({ inProgress: 0, completed: 0 });
    },
  };
}

function createMockEngine(overrides: Partial<GameEngine> = {}): GameEngine {
  const initialState = makeInitialState();
  const createdEvent = makeCreatedEvent(initialState);

  return {
    createGame(): { state: GameState; eventLog: EventLog } {
      return {
        state: initialState,
        eventLog: { gameId: initialState.gameId, events: [createdEvent] },
      };
    },
    submitAction(
      eventLog: EventLog,
      action: GameAction,
    ): {
      ok: true;
      state: GameState;
      event: ActionAppliedEvent;
      eventLog: EventLog;
    } | { ok: false; error: string } {
      const currentState = this.getState(eventLog);
      const newState = { ...currentState };

      if (action.type === "enter_room") {
        newState.phase = {
          kind: "choosing",
          cardsChosen: 0,
          potionUsedThisTurn: false,
        };
      } else if (action.type === "choose_card") {
        const card = newState.room[action.cardIndex];
        newState.room = [
          ...newState.room.slice(0, action.cardIndex),
          ...newState.room.slice(action.cardIndex + 1),
        ];
        newState.lastCardPlayed = card;
        const cardsChosen = (currentState.phase as { cardsChosen: number })
          .cardsChosen + 1;
        if (cardsChosen >= 3) {
          newState.phase = { kind: "drawing" };
          newState.turnNumber = currentState.turnNumber + 1;
        } else {
          newState.phase = {
            kind: "choosing",
            cardsChosen,
            potionUsedThisTurn: false,
          };
        }
      }

      const event = makeActionAppliedEvent(
        eventLog.events.length,
        action,
        newState,
      );
      return {
        ok: true,
        state: newState,
        event,
        eventLog: {
          gameId: eventLog.gameId,
          events: [...eventLog.events, event],
        },
      };
    },
    getState(eventLog: EventLog): GameState {
      const lastEvent = eventLog.events[eventLog.events.length - 1];
      if (lastEvent.kind === "game_created") return lastEvent.initialState;
      return lastEvent.stateAfter;
    },
    replay(_eventLog: EventLog): readonly GameState[] {
      return [];
    },
    getScore(_state: GameState): number {
      return 0;
    },
    ...overrides,
  };
}

Deno.test("createGame returns a GameView with initial state", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const view = await service.createGame("Hero");

  assertEquals(view.health, 20);
  assertEquals(view.dungeonCount, 4);
  assertEquals(view.room, []);
  assertEquals(view.discardCount, 0);
  assertEquals(view.equippedWeapon, null);
  assertEquals(view.phase, { kind: "drawing" });
  assertEquals(view.score, null);
  assertEquals(view.playerName, "Hero");
});

Deno.test("createGame persists the game event", async () => {
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const view = await service.createGame("Hero");

  const events = storedEvents.get(view.gameId);
  assertEquals(events?.length, 1);
  assertEquals(events?.[0].sequence, 0);
  assertEquals(events?.[0].payload.kind, "game_created");
});

Deno.test("createGame throws OffensivePlayerNameError for profane names", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const error = await assertRejects(
    () => service.createGame("fuck"),
    AppError,
  );
  assertEquals(error.reason, "OffensivePlayerNameError");
  assertEquals(error.statusCode, 422);
});

Deno.test("getGame returns GameView for existing game", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const created = await service.createGame("Hero");
  const retrieved = await service.getGame(created.gameId);

  assertEquals(retrieved.gameId, created.gameId);
  assertEquals(retrieved.health, 20);
  assertEquals(retrieved.playerName, "Hero");
});

Deno.test("getGame throws GameNotFoundError for non-existent game", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const error = await assertRejects(
    () => service.getGame("non-existent-id"),
    AppError,
  );
  assertEquals(error.reason, "GameNotFoundError");
  assertEquals(error.statusCode, 404);
  assertEquals(error.data.gameId, "non-existent-id");
});

Deno.test("getGame throws GameNotFoundError for non-uuid id without hitting repository", async () => {
  const repository: GameRepository = {
    ...createMockRepository(),
    getLatestEvent(_gameId: string): Promise<StoredEvent | null> {
      throw new Error(
        'invalid input syntax for type uuid: "not-a-uuid"',
      );
    },
  };
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const error = await assertRejects(
    () => service.getGame("not-a-uuid"),
    AppError,
  );
  assertEquals(error.reason, "GameNotFoundError");
  assertEquals(error.statusCode, 404);
});

Deno.test("submitAction returns updated GameView on success", async () => {
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);

  const initialState = makeInitialState();
  // Set up a state in room_ready phase to test auto-enter
  const roomReadyState: GameState = {
    ...initialState,
    room: [
      { suit: "diamonds", rank: 3 },
      { suit: "hearts", rank: 7 },
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
    ],
    dungeon: [],
    phase: { kind: "room_ready" },
  };
  const createdEvent = makeCreatedEvent(roomReadyState);

  const engine = createMockEngine({
    createGame() {
      return {
        state: roomReadyState,
        eventLog: { gameId: roomReadyState.gameId, events: [createdEvent] },
      };
    },
  });

  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );
  const view = await service.createGame("Hero");

  // Submit choose_card - should auto-enter room first
  const result = await service.submitAction(view.gameId, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });

  assertEquals(result.room.length, 3);
});

Deno.test("submitAction throws GameNotFoundError for non-existent game", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const error = await assertRejects(
    () => service.submitAction("non-existent", { type: "draw_card" }),
    AppError,
  );
  assertEquals(error.reason, "GameNotFoundError");
  assertEquals(error.statusCode, 404);
  assertEquals(error.data.gameId, "non-existent");
});

Deno.test("submitAction throws InvalidActionError for invalid action", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine({
    submitAction() {
      return { ok: false, error: "Cannot draw card: phase is not drawing" };
    },
  });
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const view = await service.createGame("Hero");
  const error = await assertRejects(
    () => service.submitAction(view.gameId, { type: "draw_card" }),
    AppError,
  );
  assertEquals(error.reason, "InvalidActionError");
  assertEquals(error.statusCode, 422);
});

Deno.test("getEventLog returns events for completed game", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const view = await service.createGame("Hero");
  // Mark as completed
  await repository.updateStatus(view.gameId, "completed", 10);
  const eventLog = await service.getEventLog(view.gameId);

  assertEquals(eventLog.gameId, view.gameId);
  assertEquals(eventLog.events.length, 1);
});

Deno.test("getEventLog throws GameNotFoundError for non-existent game", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const error = await assertRejects(
    () => service.getEventLog("non-existent"),
    AppError,
  );
  assertEquals(error.reason, "GameNotFoundError");
  assertEquals(error.statusCode, 404);
  assertEquals(error.data.gameId, "non-existent");
});

Deno.test("getEventLog throws GameNotFoundError for non-UUID id without hitting repository", async () => {
  const repository: GameRepository = {
    ...createMockRepository(),
    getGameStatus(_gameId: string): Promise<string | null> {
      throw new Error("should not be called");
    },
  };
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const error = await assertRejects(
    () => service.getEventLog("not-a-uuid"),
    AppError,
  );
  assertEquals(error.reason, "GameNotFoundError");
  assertEquals(error.statusCode, 404);
});

Deno.test("getEventLog throws GameNotFoundError for in-progress game", async () => {
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  // Game is in_progress by default after createGame
  const view = await service.createGame("Hero");
  const error = await assertRejects(
    () => service.getEventLog(view.gameId),
    AppError,
  );
  assertEquals(error.reason, "GameNotFoundError");
  assertEquals(error.statusCode, 404);
});

Deno.test("submitAction throws GameNotFoundError for non-UUID id without hitting repository", async () => {
  const repository: GameRepository = {
    ...createMockRepository(),
    getLatestEvent(_gameId: string): Promise<StoredEvent | null> {
      throw new Error("should not be called");
    },
  };
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const error = await assertRejects(
    () => service.submitAction("not-a-uuid", { type: "draw_card" }),
    AppError,
  );
  assertEquals(error.reason, "GameNotFoundError");
  assertEquals(error.statusCode, 404);
});

Deno.test("submitAction calls createLeaderboardEntry on game-over in normal flow", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const gameOverState: GameState = {
    ...makeInitialState(gameId),
    phase: { kind: "game_over", reason: "dead" },
  };

  const createdEvent = makeCreatedEvent(makeInitialState(gameId));
  const storedEvents = new Map<string, StoredEvent[]>();
  storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

  let capturedLeaderboardGameId: string | null = null;
  let capturedLeaderboardPlayerName: string | null = null;
  let capturedLeaderboardScore: number | null = null;
  let capturedLeaderboardDate: Date | null = null;

  const repository: GameRepository = {
    ...createMockRepository(storedEvents),
    createLeaderboardEntry(
      gId: string,
      pName: string,
      score: number,
      completedAt: Date,
    ): Promise<void> {
      capturedLeaderboardGameId = gId;
      capturedLeaderboardPlayerName = pName;
      capturedLeaderboardScore = score;
      capturedLeaderboardDate = completedAt;
      return Promise.resolve();
    },
    getPlayerName(_gameId: string): Promise<string | null> {
      return Promise.resolve("Hero");
    },
  };

  const engine = createMockEngine({
    submitAction(_eventLog: EventLog, _action: GameAction): {
      ok: true;
      state: GameState;
      event: ActionAppliedEvent;
      eventLog: EventLog;
    } | { ok: false; error: string } {
      const event = makeActionAppliedEvent(
        1,
        { type: "draw_card" } as GameAction,
        gameOverState,
      );
      return {
        ok: true,
        state: gameOverState,
        event,
        eventLog: { gameId, events: [createdEvent, event] },
      };
    },
    getScore(_state: GameState): number {
      return 42;
    },
  });

  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );
  await service.submitAction(gameId, { type: "draw_card" });

  assertEquals(capturedLeaderboardGameId, gameId);
  assertEquals(capturedLeaderboardPlayerName, "Hero");
  assertEquals(capturedLeaderboardScore, 42);
  assertEquals(capturedLeaderboardDate !== null, true);
});

Deno.test("submitAction calls createLeaderboardEntry on game-over in auto-enter-room flow", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const roomReadyState: GameState = {
    ...makeInitialState(gameId),
    room: [
      { suit: "diamonds", rank: 3 },
      { suit: "hearts", rank: 7 },
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
    ],
    dungeon: [],
    phase: { kind: "room_ready" },
  };

  const createdEvent = makeCreatedEvent(roomReadyState);
  const storedEvents = new Map<string, StoredEvent[]>();
  storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

  let capturedLeaderboardGameId: string | null = null;
  let capturedLeaderboardPlayerName: string | null = null;
  let capturedLeaderboardScore: number | null = null;
  let capturedLeaderboardDate: Date | null = null;

  const repository: GameRepository = {
    ...createMockRepository(storedEvents),
    createLeaderboardEntry(
      gId: string,
      pName: string,
      score: number,
      completedAt: Date,
    ): Promise<void> {
      capturedLeaderboardGameId = gId;
      capturedLeaderboardPlayerName = pName;
      capturedLeaderboardScore = score;
      capturedLeaderboardDate = completedAt;
      return Promise.resolve();
    },
    getPlayerName(_gameId: string): Promise<string | null> {
      return Promise.resolve("Hero");
    },
  };

  const gameOverState: GameState = {
    ...roomReadyState,
    phase: { kind: "game_over", reason: "dead" },
  };
  let submitCallCount = 0;

  const engine = createMockEngine({
    getState(_eventLog: EventLog): GameState {
      return roomReadyState;
    },
    submitAction(_eventLog: EventLog, action: GameAction): {
      ok: true;
      state: GameState;
      event: ActionAppliedEvent;
      eventLog: EventLog;
    } | { ok: false; error: string } {
      submitCallCount++;
      if (submitCallCount === 1) {
        // enter_room call
        const enterState: GameState = {
          ...roomReadyState,
          phase: {
            kind: "choosing",
            cardsChosen: 0,
            potionUsedThisTurn: false,
          },
        };
        const event = makeActionAppliedEvent(1, action, enterState);
        return {
          ok: true,
          state: enterState,
          event,
          eventLog: { gameId, events: [createdEvent, event] },
        };
      }
      // choose_card call -> game_over
      const event = makeActionAppliedEvent(2, action, gameOverState);
      return {
        ok: true,
        state: gameOverState,
        event,
        eventLog: { gameId, events: [createdEvent, event] },
      };
    },
    getScore(_state: GameState): number {
      return 99;
    },
  });

  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );
  await service.submitAction(gameId, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });

  assertEquals(capturedLeaderboardGameId, gameId);
  assertEquals(capturedLeaderboardPlayerName, "Hero");
  assertEquals(capturedLeaderboardScore, 99);
  assertEquals(capturedLeaderboardDate !== null, true);
});

Deno.test("getLeaderboard delegates to repository with limit 25", async () => {
  let capturedLimit: number | null = null;
  const repository = createMockRepository();
  const originalGetLeaderboard = repository.getLeaderboard.bind(repository);
  repository.getLeaderboard = (limit: number) => {
    capturedLimit = limit;
    return originalGetLeaderboard(limit);
  };
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  await service.getLeaderboard();

  assertEquals(capturedLimit, 25);
});

Deno.test("getLeaderboardEntry delegates to repository", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  let capturedGameId: string | null = null;
  const repository = createMockRepository();
  repository.getLeaderboardEntry = (gId: string) => {
    capturedGameId = gId;
    return Promise.resolve(null);
  };
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  await service.getLeaderboardEntry(gameId);

  assertEquals(capturedGameId, gameId);
});

Deno.test("getLeaderboardRank returns rank for game with leaderboard entry", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const entry = {
    gameId,
    playerName: "Hero",
    score: 15,
    completedAt: new Date().toISOString(),
  };
  const repository = createMockRepository();
  repository.getLeaderboardEntry = (_gId: string) => Promise.resolve(entry);
  repository.getLeaderboardRank = (_score: number, _completedAt: Date) =>
    Promise.resolve({ rank: 3, totalEntries: 10 });
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const result = await service.getLeaderboardRank(gameId);

  assertEquals(result?.entry, entry);
  assertEquals(result?.rank, 3);
  assertEquals(result?.topPercent, 30);
});

Deno.test("getLeaderboardRank computes topPercent as ceil percentage of rank/total", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const entry = {
    gameId,
    playerName: "Hero",
    score: 15,
    completedAt: new Date().toISOString(),
  };
  const repository = createMockRepository();
  repository.getLeaderboardEntry = (_gId: string) => Promise.resolve(entry);
  repository.getLeaderboardRank = (_score: number, _completedAt: Date) =>
    Promise.resolve({ rank: 3, totalEntries: 100 });
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const result = await service.getLeaderboardRank(gameId);

  assertEquals(result?.topPercent, 3);
});

Deno.test("getLeaderboardRank returns topPercent 100 for single player", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const entry = {
    gameId,
    playerName: "Hero",
    score: 15,
    completedAt: new Date().toISOString(),
  };
  const repository = createMockRepository();
  repository.getLeaderboardEntry = (_gId: string) => Promise.resolve(entry);
  repository.getLeaderboardRank = (_score: number, _completedAt: Date) =>
    Promise.resolve({ rank: 1, totalEntries: 1 });
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const result = await service.getLeaderboardRank(gameId);

  assertEquals(result?.topPercent, 100);
});

Deno.test("getLeaderboardRank returns null when game has no leaderboard entry", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const repository = createMockRepository();
  repository.getLeaderboardEntry = (_gId: string) => Promise.resolve(null);
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const result = await service.getLeaderboardRank(gameId);

  assertEquals(result, null);
});

Deno.test("getLeaderboardRank returns null for invalid UUID", async () => {
  const repository: GameRepository = {
    ...createMockRepository(),
    getLeaderboardEntry(_gameId: string) {
      throw new Error("should not be called");
    },
  };
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const result = await service.getLeaderboardRank("not-a-uuid");
  assertEquals(result, null);
});

Deno.test("getLeaderboardRank passes completedAt from entry to repository", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const completedAtIso = "2026-02-15T12:00:00.000Z";
  const entry = {
    gameId,
    playerName: "Hero",
    score: 15,
    completedAt: completedAtIso,
  };
  let capturedCompletedAt: Date | undefined;
  const repository = createMockRepository();
  repository.getLeaderboardEntry = (_gId: string) => Promise.resolve(entry);
  repository.getLeaderboardRank = (_score: number, completedAt: Date) => {
    capturedCompletedAt = completedAt;
    return Promise.resolve({ rank: 1, totalEntries: 1 });
  };
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  await service.getLeaderboardRank(gameId);

  assertEquals(capturedCompletedAt!.toISOString(), completedAtIso);
});

// ---------------------------------------------------------------------------
// Parallel DB call tests
// ---------------------------------------------------------------------------

const DELAY_MS = 20;
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test(
  "submitAction — getLatestEvent and getPlayerName run concurrently",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const createdEvent = makeCreatedEvent(makeInitialState(gameId));
    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

    const starts: number[] = [];

    const repository: GameRepository = {
      ...createMockRepository(storedEvents),
      getLatestEvent: async (_id: string) => {
        starts.push(Date.now());
        await sleep(DELAY_MS);
        const events = storedEvents.get(_id);
        if (!events || events.length === 0) return null;
        return events[events.length - 1];
      },
      getPlayerName: async (_id: string) => {
        starts.push(Date.now());
        await sleep(DELAY_MS);
        return "Hero";
      },
    };

    const engine = createMockEngine();
    const service = createGameService(
      engine,
      repository,
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const t0 = Date.now();
    await service.submitAction(gameId, { type: "draw_card" });
    const elapsed = Date.now() - t0;

    assertEquals(starts.length, 2, "both DB calls must be made");
    // If concurrent, both calls start within a few ms of each other.
    // If serial, the second call starts at least DELAY_MS after the first.
    const gap = Math.abs(starts[1] - starts[0]);
    assertLess(
      gap,
      DELAY_MS,
      `calls should start near-simultaneously but gap was ${gap}ms`,
    );
    assertLess(
      elapsed,
      DELAY_MS * 2 - 5,
      `expected parallel execution (~${DELAY_MS}ms) but elapsed=${elapsed}ms`,
    );
  },
);

Deno.test(
  "getGame — getLatestEvent and getPlayerName run concurrently",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const createdEvent = makeCreatedEvent(makeInitialState(gameId));
    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

    const starts: number[] = [];

    const repository: GameRepository = {
      ...createMockRepository(storedEvents),
      getLatestEvent: async (_id: string) => {
        starts.push(Date.now());
        await sleep(DELAY_MS);
        const events = storedEvents.get(_id);
        if (!events || events.length === 0) return null;
        return events[events.length - 1];
      },
      getPlayerName: async (_id: string) => {
        starts.push(Date.now());
        await sleep(DELAY_MS);
        return "Hero";
      },
    };

    const engine = createMockEngine();
    const service = createGameService(
      engine,
      repository,
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const t0 = Date.now();
    await service.getGame(gameId);
    const elapsed = Date.now() - t0;

    assertEquals(starts.length, 2, "both DB calls must be made");
    const gap = Math.abs(starts[1] - starts[0]);
    assertLess(
      gap,
      DELAY_MS,
      `calls should start near-simultaneously but gap was ${gap}ms`,
    );
    assertLess(
      elapsed,
      DELAY_MS * 2 - 5,
      `expected parallel execution (~${DELAY_MS}ms) but elapsed=${elapsed}ms`,
    );
  },
);

Deno.test(
  "submitAction game over — updateStatus and createLeaderboardEntry run concurrently",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const initialState = makeInitialState(gameId);
    const gameOverState: GameState = {
      ...initialState,
      phase: { kind: "game_over", reason: "dead" },
    };
    const createdEvent = makeCreatedEvent(initialState);
    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

    const writeStarts: number[] = [];

    const repository: GameRepository = {
      ...createMockRepository(storedEvents),
      getPlayerName: () => Promise.resolve("Hero"),
      updateStatus: async (
        _id: string,
        _status: string,
        _score: number | null,
      ) => {
        writeStarts.push(Date.now());
        await sleep(DELAY_MS);
      },
      createLeaderboardEntry: async (
        _id: string,
        _name: string,
        _score: number,
        _date: Date,
      ) => {
        writeStarts.push(Date.now());
        await sleep(DELAY_MS);
      },
    };

    const engine = createMockEngine({
      submitAction(): {
        ok: true;
        state: GameState;
        event: ActionAppliedEvent;
        eventLog: EventLog;
      } | { ok: false; error: string } {
        const event = makeActionAppliedEvent(
          1,
          { type: "draw_card" } as GameAction,
          gameOverState,
        );
        return {
          ok: true,
          state: gameOverState,
          event,
          eventLog: { gameId, events: [createdEvent, event] },
        };
      },
      getScore: () => 7,
    });

    const service = createGameService(
      engine,
      repository,
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const t0 = Date.now();
    await service.submitAction(gameId, { type: "draw_card" });
    const elapsed = Date.now() - t0;

    assertEquals(writeStarts.length, 2, "both writes must occur on game over");
    const gap = Math.abs(writeStarts[1] - writeStarts[0]);
    assertLess(
      gap,
      DELAY_MS,
      `writes should start near-simultaneously but gap was ${gap}ms`,
    );
    assertLess(
      elapsed,
      DELAY_MS * 2 - 5,
      `expected parallel writes (~${DELAY_MS}ms) but elapsed=${elapsed}ms`,
    );
  },
);

// ---------------------------------------------------------------------------
// choose_card action log enrichment tests
// ---------------------------------------------------------------------------

async function captureGameLogs(
  fn: () => Promise<unknown>,
): Promise<LogRecord[]> {
  const records: LogRecord[] = [];
  await configure({
    sinks: { capture: (r) => records.push(r) },
    loggers: [
      {
        category: ["scoundrel", "game"],
        lowestLevel: "debug",
        sinks: ["capture"],
      },
    ],
    reset: true,
  });
  await fn();
  await configure({ sinks: {}, loggers: [], reset: true });
  return records;
}

function makeChoosingState(
  gameId: string,
  overrides: Partial<GameState> = {},
): GameState {
  return {
    gameId,
    health: 20,
    dungeon: [],
    room: [],
    discard: [],
    equippedWeapon: null,
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    lastRoomAvoided: false,
    turnNumber: 1,
    lastCardPlayed: null,
    ...overrides,
  };
}

function makeChoosingStoredEvent(
  _gameId: string,
  state: GameState,
): StoredEvent {
  return {
    sequence: 1,
    payload: makeActionAppliedEvent(
      1,
      { type: "enter_room" } as GameAction,
      state,
    ),
  };
}

Deno.test(
  "submitAction choose_card monster (barehanded) — logs actionKind, card, damage",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const monsterCard = { suit: "clubs" as const, rank: 7 as const };
    const stateBefore = makeChoosingState(gameId, {
      room: [monsterCard],
      health: 20,
    });
    const stateAfter = makeChoosingState(gameId, {
      room: [],
      health: 13,
      lastCardPlayed: monsterCard,
    });

    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [makeChoosingStoredEvent(gameId, stateBefore)]);

    const engine = createMockEngine({
      getState: () => stateBefore,
      submitAction: (_log, _action) => {
        const event = makeActionAppliedEvent(
          2,
          { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
          stateAfter,
        );
        return {
          ok: true,
          state: stateAfter,
          event,
          eventLog: { gameId, events: [] },
        };
      },
    });

    const service = createGameService(
      engine,
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, {
        type: "choose_card",
        cardIndex: 0,
        fightWith: "barehanded",
      })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionType, "choose_card");
    assertEquals(actionLog?.properties.actionKind, "combat_barehanded");
    assertEquals(actionLog?.properties.cardType, "monster");
    assertEquals(actionLog?.properties.cardSuit, "clubs");
    assertEquals(actionLog?.properties.cardRank, 7);
    assertEquals(actionLog?.properties.fightWith, "barehanded");
    assertEquals(actionLog?.properties.damage, 7);
  },
);

Deno.test(
  "submitAction choose_card monster (with weapon) — logs actionKind, card, weapon, damage",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const monsterCard = { suit: "spades" as const, rank: 11 as const };
    const weaponCard = { suit: "diamonds" as const, rank: 5 as const };
    const stateBefore = makeChoosingState(gameId, {
      room: [monsterCard],
      health: 20,
      equippedWeapon: { card: weaponCard, slainMonsters: [] },
    });
    const stateAfter = makeChoosingState(gameId, {
      room: [],
      health: 14,
      lastCardPlayed: monsterCard,
      equippedWeapon: { card: weaponCard, slainMonsters: [monsterCard] },
    });

    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [makeChoosingStoredEvent(gameId, stateBefore)]);

    const engine = createMockEngine({
      getState: () => stateBefore,
      submitAction: (_log, _action) => {
        const event = makeActionAppliedEvent(
          2,
          { type: "choose_card", cardIndex: 0, fightWith: "weapon" },
          stateAfter,
        );
        return {
          ok: true,
          state: stateAfter,
          event,
          eventLog: { gameId, events: [] },
        };
      },
    });

    const service = createGameService(
      engine,
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, {
        type: "choose_card",
        cardIndex: 0,
        fightWith: "weapon",
      })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionKind, "combat_with_weapon");
    assertEquals(actionLog?.properties.cardType, "monster");
    assertEquals(actionLog?.properties.cardSuit, "spades");
    assertEquals(actionLog?.properties.cardRank, 11);
    assertEquals(actionLog?.properties.fightWith, "weapon");
    assertEquals(actionLog?.properties.damage, 6);
    assertEquals(actionLog?.properties.weaponSuit, "diamonds");
    assertEquals(actionLog?.properties.weaponRank, 5);
  },
);

Deno.test(
  "submitAction choose_card weapon — logs actionKind equip_weapon",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const weaponCard = { suit: "diamonds" as const, rank: 8 as const };
    const stateBefore = makeChoosingState(gameId, {
      room: [weaponCard],
      health: 20,
    });
    const stateAfter = makeChoosingState(gameId, {
      room: [],
      health: 20,
      lastCardPlayed: weaponCard,
      equippedWeapon: { card: weaponCard, slainMonsters: [] },
    });

    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [makeChoosingStoredEvent(gameId, stateBefore)]);

    const engine = createMockEngine({
      getState: () => stateBefore,
      submitAction: (_log, _action) => {
        const event = makeActionAppliedEvent(
          2,
          { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
          stateAfter,
        );
        return {
          ok: true,
          state: stateAfter,
          event,
          eventLog: { gameId, events: [] },
        };
      },
    });

    const service = createGameService(
      engine,
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, {
        type: "choose_card",
        cardIndex: 0,
        fightWith: "barehanded",
      })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionKind, "equip_weapon");
    assertEquals(actionLog?.properties.cardType, "weapon");
    assertEquals(actionLog?.properties.cardSuit, "diamonds");
    assertEquals(actionLog?.properties.cardRank, 8);
  },
);

Deno.test(
  "submitAction choose_card potion — logs actionKind drink_potion and healthHealed",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const potionCard = { suit: "hearts" as const, rank: 5 as const };
    const stateBefore = makeChoosingState(gameId, {
      room: [potionCard],
      health: 15,
    });
    const stateAfter = makeChoosingState(gameId, {
      room: [],
      health: 20,
      lastCardPlayed: potionCard,
    });

    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [makeChoosingStoredEvent(gameId, stateBefore)]);

    const engine = createMockEngine({
      getState: () => stateBefore,
      submitAction: (_log, _action) => {
        const event = makeActionAppliedEvent(
          2,
          { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
          stateAfter,
        );
        return {
          ok: true,
          state: stateAfter,
          event,
          eventLog: { gameId, events: [] },
        };
      },
    });

    const service = createGameService(
      engine,
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, {
        type: "choose_card",
        cardIndex: 0,
        fightWith: "barehanded",
      })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionKind, "drink_potion");
    assertEquals(actionLog?.properties.cardType, "potion");
    assertEquals(actionLog?.properties.cardSuit, "hearts");
    assertEquals(actionLog?.properties.cardRank, 5);
    assertEquals(actionLog?.properties.healthHealed, 5);
  },
);

Deno.test(
  "submitAction choose_card (auto-enter-room) — logs enriched card data",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const monsterCard = { suit: "clubs" as const, rank: 5 as const };
    const roomReadyState: GameState = {
      ...makeInitialState(gameId),
      room: [monsterCard],
      dungeon: [],
      phase: { kind: "room_ready" },
    };
    const choosingState = makeChoosingState(gameId, {
      room: [monsterCard],
      health: 20,
    });
    const stateAfter = makeChoosingState(gameId, {
      room: [],
      health: 15,
      lastCardPlayed: monsterCard,
    });

    const createdEvent = makeCreatedEvent(roomReadyState);
    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

    let submitCallCount = 0;
    const engine = createMockEngine({
      getState: (_log) => roomReadyState,
      submitAction: (_log, _action) => {
        submitCallCount++;
        if (submitCallCount === 1) {
          // enter_room
          const event = makeActionAppliedEvent(
            1,
            { type: "enter_room" },
            choosingState,
          );
          return {
            ok: true,
            state: choosingState,
            event,
            eventLog: { gameId, events: [createdEvent, event] },
          };
        }
        // choose_card
        const event = makeActionAppliedEvent(2, {
          type: "choose_card",
          cardIndex: 0,
          fightWith: "barehanded",
        }, stateAfter);
        return {
          ok: true,
          state: stateAfter,
          event,
          eventLog: { gameId, events: [] },
        };
      },
    });

    const service = createGameService(
      engine,
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, {
        type: "choose_card",
        cardIndex: 0,
        fightWith: "barehanded",
      })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionKind, "combat_barehanded");
    assertEquals(actionLog?.properties.cardType, "monster");
    assertEquals(actionLog?.properties.cardSuit, "clubs");
    assertEquals(actionLog?.properties.cardRank, 5);
    assertEquals(actionLog?.properties.damage, 5);
  },
);

Deno.test(
  "submitAction non-choose_card action — logs without enriched card fields",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const createdEvent = makeCreatedEvent(makeInitialState(gameId));
    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

    const service = createGameService(
      createMockEngine(),
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, { type: "draw_card" })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionType, "draw_card");
    assertEquals(actionLog?.properties.actionKind, "draw_card");
    assertEquals(actionLog?.properties.cardType, undefined);
  },
);

Deno.test(
  "submitAction avoid_room — logs actionKind avoid_room",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const roomReadyState: GameState = {
      ...makeInitialState(gameId),
      room: [
        { suit: "clubs", rank: 5 },
        { suit: "diamonds", rank: 3 },
        { suit: "hearts", rank: 7 },
        { suit: "spades", rank: 10 },
      ],
      phase: { kind: "room_ready" },
    };
    const createdEvent = makeCreatedEvent(roomReadyState);
    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

    const engine = createMockEngine({
      getState: () => roomReadyState,
      submitAction: (_log, action) => {
        const afterState: GameState = {
          ...roomReadyState,
          room: [],
          phase: { kind: "drawing" },
        };
        const event = makeActionAppliedEvent(1, action, afterState);
        return {
          ok: true,
          state: afterState,
          event,
          eventLog: { gameId, events: [createdEvent, event] },
        };
      },
    });

    const service = createGameService(
      engine,
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, { type: "avoid_room" })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionType, "avoid_room");
    assertEquals(actionLog?.properties.actionKind, "avoid_room");
  },
);

Deno.test(
  "submitAction enter_room — logs actionKind enter_room",
  async () => {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const roomReadyState: GameState = {
      ...makeInitialState(gameId),
      room: [
        { suit: "clubs", rank: 5 },
        { suit: "diamonds", rank: 3 },
        { suit: "hearts", rank: 7 },
        { suit: "spades", rank: 10 },
      ],
      phase: { kind: "room_ready" },
    };
    const createdEvent = makeCreatedEvent(roomReadyState);
    const storedEvents = new Map<string, StoredEvent[]>();
    storedEvents.set(gameId, [{ sequence: 0, payload: createdEvent }]);

    const engine = createMockEngine({
      getState: () => roomReadyState,
      submitAction: (_log, action) => {
        const choosingState: GameState = {
          ...roomReadyState,
          phase: {
            kind: "choosing",
            cardsChosen: 0,
            potionUsedThisTurn: false,
          },
        };
        const event = makeActionAppliedEvent(1, action, choosingState);
        return {
          ok: true,
          state: choosingState,
          event,
          eventLog: { gameId, events: [createdEvent, event] },
        };
      },
    });

    const service = createGameService(
      engine,
      createMockRepository(storedEvents),
      TEST_CONFIG,
      createSpyTracer().tracer,
    );

    const records = await captureGameLogs(() =>
      service.submitAction(gameId, { type: "enter_room" })
    );

    const actionLog = records.find(
      (r) => String(r.rawMessage) === "Action submitted",
    );
    assertEquals(actionLog?.properties.actionType, "enter_room");
    assertEquals(actionLog?.properties.actionKind, "enter_room");
  },
);

// ---------------------------------------------------------------------------
// fill_room tests
// ---------------------------------------------------------------------------

function createDrawCardEngine(initialState: GameState): GameEngine {
  const createdEvent = makeCreatedEvent(initialState);
  return {
    createGame(): { state: GameState; eventLog: EventLog } {
      return {
        state: initialState,
        eventLog: { gameId: initialState.gameId, events: [createdEvent] },
      };
    },
    submitAction(
      eventLog: EventLog,
      action: GameAction,
    ): {
      ok: true;
      state: GameState;
      event: ActionAppliedEvent;
      eventLog: EventLog;
    } | { ok: false; error: string } {
      const currentState = this.getState(eventLog);

      if (
        action.type === "draw_card" && currentState.phase.kind === "drawing"
      ) {
        const drawnCard = currentState.dungeon[0];
        const remainingDungeon = currentState.dungeon.slice(1);
        const newRoom = [...currentState.room, drawnCard];
        const roomFull = newRoom.length >= 4;
        const dungeonEmpty = remainingDungeon.length === 0;

        const newState: GameState = {
          ...currentState,
          dungeon: remainingDungeon,
          room: newRoom,
          phase: roomFull || dungeonEmpty
            ? { kind: "room_ready" }
            : { kind: "drawing" },
        };
        const event = makeActionAppliedEvent(
          eventLog.events.length,
          action,
          newState,
        );
        return {
          ok: true,
          state: newState,
          event,
          eventLog: {
            gameId: eventLog.gameId,
            events: [...eventLog.events, event],
          },
        };
      }

      return { ok: false, error: `Unsupported action: ${action.type}` };
    },
    getState(eventLog: EventLog): GameState {
      const lastEvent = eventLog.events[eventLog.events.length - 1];
      if (lastEvent.kind === "game_created") return lastEvent.initialState;
      return lastEvent.stateAfter;
    },
    replay(_eventLog: EventLog): readonly GameState[] {
      return [];
    },
    getScore(_state: GameState): number {
      return 0;
    },
  };
}

Deno.test("fill_room draws cards until room has 4", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const initialState: GameState = {
    ...makeInitialState(gameId),
    dungeon: [
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
      { suit: "clubs", rank: 3 },
      { suit: "spades", rank: 7 },
      { suit: "hearts", rank: 2 },
    ],
    room: [],
  };

  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createDrawCardEngine(initialState);
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const created = await service.createGame("Hero");
  const view = await service.submitAction(created.gameId, {
    type: "fill_room",
  });

  assertEquals(view.room.length, 4);
  assertEquals(view.dungeonCount, 1);
  assertEquals(view.phase, { kind: "room_ready" });
});

Deno.test("fill_room draws only remaining cards when dungeon has less than 4", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const initialState: GameState = {
    ...makeInitialState(gameId),
    dungeon: [
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
    ],
    room: [],
  };

  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createDrawCardEngine(initialState);
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const created = await service.createGame("Hero");
  const view = await service.submitAction(created.gameId, {
    type: "fill_room",
  });

  assertEquals(view.room.length, 2);
  assertEquals(view.dungeonCount, 0);
  assertEquals(view.phase, { kind: "room_ready" });
});

Deno.test("fill_room with 1 leftover card draws only 3", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const initialState: GameState = {
    ...makeInitialState(gameId),
    dungeon: [
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
      { suit: "clubs", rank: 3 },
      { suit: "spades", rank: 7 },
    ],
    room: [{ suit: "hearts", rank: 2 }],
  };

  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createDrawCardEngine(initialState);
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const created = await service.createGame("Hero");
  const view = await service.submitAction(created.gameId, {
    type: "fill_room",
  });

  assertEquals(view.room.length, 4);
  assertEquals(view.dungeonCount, 1);
  assertEquals(view.phase, { kind: "room_ready" });
});

Deno.test("fill_room persists all individual draw events", async () => {
  const gameId = "00000000-0000-0000-0000-000000000001";
  const initialState: GameState = {
    ...makeInitialState(gameId),
    dungeon: [
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
      { suit: "clubs", rank: 3 },
      { suit: "spades", rank: 7 },
    ],
    room: [],
  };

  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createDrawCardEngine(initialState);
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    createSpyTracer().tracer,
  );

  const created = await service.createGame("Hero");
  await service.submitAction(created.gameId, { type: "fill_room" });

  const events = storedEvents.get(created.gameId);
  // 1 game_created + 4 draw_card events = 5 total
  assertEquals(events?.length, 5);
  // All draw events should be action_applied with draw_card
  for (let i = 1; i < events!.length; i++) {
    const payload = events![i].payload;
    assertEquals(payload.kind, "action_applied");
    if (payload.kind === "action_applied") {
      assertEquals(payload.action.type, "draw_card");
    }
  }
});
