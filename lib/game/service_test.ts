import { assertEquals, assertRejects } from "@std/assert";
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
