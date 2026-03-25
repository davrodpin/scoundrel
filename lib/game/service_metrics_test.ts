import { assertEquals } from "@std/assert";
import type {
  EventLog,
  GameAction,
  GameEngine,
  GameEvent as EngineGameEvent,
  GameState,
} from "@scoundrel/engine";
import type { GameRepository, StoredEvent } from "./repository.ts";
import { createGameService, type GameServiceConfig } from "./service.ts";
import { createSpyMeter } from "../telemetry/testing.ts";
import { createSpyTracer } from "../telemetry/testing.ts";

const TEST_CONFIG: GameServiceConfig = {
  defaultPlayerName: "Anonymous",
  leaderboardLimit: 25,
};

const GAME_ID = "00000000-0000-0000-0000-000000000001";

function makeInitialState(gameId = GAME_ID): GameState {
  return {
    gameId,
    health: 20,
    dungeon: [],
    room: [],
    discard: [],
    equippedWeapon: null,
    phase: { kind: "drawing" },
    lastRoomAvoided: false,
    turnNumber: 1,
    lastCardPlayed: null,
  };
}

function makeCreatedEvent(state: GameState) {
  return {
    kind: "game_created" as const,
    id: 0,
    timestamp: new Date().toISOString(),
    gameId: state.gameId,
    initialState: state,
  };
}

function makeActionEvent(id: number, action: GameAction, state: GameState) {
  return {
    kind: "action_applied" as const,
    id,
    timestamp: new Date().toISOString(),
    action,
    stateAfter: state,
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
    getLeaderboardRank(_score: number) {
      return Promise.resolve({ rank: 1, totalEntries: 1 });
    },
    createLeaderboardEntry(): Promise<void> {
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
    ): ReturnType<GameEngine["submitAction"]> {
      const currentState = this.getState(eventLog);
      const newState = { ...currentState };
      if (action.type === "enter_room") {
        newState.phase = {
          kind: "choosing",
          cardsChosen: 0,
          potionUsedThisTurn: false,
        };
      }
      const event = makeActionEvent(eventLog.events.length, action, newState);
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
      return 10;
    },
    ...overrides,
  };
}

Deno.test("createGame increments game.in_progress by 1", async () => {
  const { tracer } = createSpyTracer();
  const { meter, getMetrics } = createSpyMeter();
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    tracer,
    meter,
  );

  await service.createGame("Hero");

  const metrics = getMetrics();
  const inProgress = metrics.filter((m) => m.name === "game.in_progress");
  assertEquals(inProgress.length, 1);
  assertEquals(inProgress[0].value, 1);
});

Deno.test("submitAction game over increments game.completed by 1", async () => {
  const { tracer } = createSpyTracer();
  const { meter, getMetrics } = createSpyMeter();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const gameOverState: GameState = {
    ...makeInitialState(),
    phase: { kind: "game_over", reason: "dead" },
  };
  const engine = createMockEngine({
    submitAction(
      eventLog: EventLog,
      action: GameAction,
    ): ReturnType<GameEngine["submitAction"]> {
      const event = makeActionEvent(
        eventLog.events.length,
        action,
        gameOverState,
      );
      return {
        ok: true,
        state: gameOverState,
        event,
        eventLog: {
          gameId: eventLog.gameId,
          events: [...eventLog.events, event],
        },
      };
    },
  });
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    tracer,
    meter,
  );

  const view = await service.createGame("Hero");
  const metricsBefore = getMetrics().length;
  await service.submitAction(view.gameId, { type: "draw_card" });

  const newMetrics = getMetrics().slice(metricsBefore);
  const completed = newMetrics.filter((m) => m.name === "game.completed");
  assertEquals(completed.length, 1);
  assertEquals(completed[0].value, 1);
});

Deno.test("submitAction game over decrements game.in_progress by 1", async () => {
  const { tracer } = createSpyTracer();
  const { meter, getMetrics } = createSpyMeter();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const gameOverState: GameState = {
    ...makeInitialState(),
    phase: { kind: "game_over", reason: "dead" },
  };
  const engine = createMockEngine({
    submitAction(
      eventLog: EventLog,
      action: GameAction,
    ): ReturnType<GameEngine["submitAction"]> {
      const event = makeActionEvent(
        eventLog.events.length,
        action,
        gameOverState,
      );
      return {
        ok: true,
        state: gameOverState,
        event,
        eventLog: {
          gameId: eventLog.gameId,
          events: [...eventLog.events, event],
        },
      };
    },
  });
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    tracer,
    meter,
  );

  const view = await service.createGame("Hero");
  const metricsBefore = getMetrics().length;
  await service.submitAction(view.gameId, { type: "draw_card" });

  const newMetrics = getMetrics().slice(metricsBefore);
  const inProgress = newMetrics.filter((m) => m.name === "game.in_progress");
  assertEquals(inProgress.length, 1);
  assertEquals(inProgress[0].value, -1);
});

Deno.test("submitAction that does not end game does not emit game.completed", async () => {
  const { tracer } = createSpyTracer();
  const { meter, getMetrics } = createSpyMeter();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    tracer,
    meter,
  );

  const view = await service.createGame("Hero");
  const metricsBefore = getMetrics().length;
  await service.submitAction(view.gameId, { type: "draw_card" });

  const newMetrics = getMetrics().slice(metricsBefore);
  const completed = newMetrics.filter((m) => m.name === "game.completed");
  assertEquals(completed.length, 0);
});

Deno.test("auto-enter-room path that ends game emits game.completed and decrements game.in_progress", async () => {
  const { tracer } = createSpyTracer();
  const { meter, getMetrics } = createSpyMeter();

  const gameOverState: GameState = {
    ...makeInitialState(),
    room: [
      { suit: "clubs", rank: 3 },
      { suit: "clubs", rank: 5 },
      { suit: "clubs", rank: 7 },
      { suit: "clubs", rank: 9 },
    ],
    phase: { kind: "game_over", reason: "dead" },
  };
  const roomReadyState: GameState = {
    ...makeInitialState(),
    room: gameOverState.room,
    phase: { kind: "room_ready" },
  };
  const createdEvent = makeCreatedEvent(roomReadyState);
  const storedEvents = new Map<string, StoredEvent[]>();
  storedEvents.set(GAME_ID, [{ sequence: 0, payload: createdEvent }]);

  const repository = createMockRepository(storedEvents);
  repository.getPlayerName = (_gameId: string) => Promise.resolve("Hero");

  const engine = createMockEngine({
    getState(_eventLog: EventLog): GameState {
      return roomReadyState;
    },
    submitAction(
      eventLog: EventLog,
      action: GameAction,
    ): ReturnType<GameEngine["submitAction"]> {
      const event = makeActionEvent(
        eventLog.events.length,
        action,
        gameOverState,
      );
      return {
        ok: true,
        state: gameOverState,
        event,
        eventLog: { gameId: GAME_ID, events: [...eventLog.events, event] },
      };
    },
  });

  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    tracer,
    meter,
  );
  await service.submitAction(GAME_ID, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });

  const metrics = getMetrics();
  const completed = metrics.filter((m) => m.name === "game.completed");
  const inProgressDecrement = metrics.filter(
    (m) => m.name === "game.in_progress" && m.value === -1,
  );
  assertEquals(completed.length, 1);
  assertEquals(completed[0].value, 1);
  assertEquals(inProgressDecrement.length, 1);
});

Deno.test("createGame with undefined meter does not throw", async () => {
  const { tracer } = createSpyTracer();
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(
    engine,
    repository,
    TEST_CONFIG,
    tracer,
    undefined,
  );

  const view = await service.createGame("Hero");
  assertEquals(typeof view.gameId, "string");
});
