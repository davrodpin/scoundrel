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

Deno.test("createGame creates a span named game.createGame", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  await service.createGame("Hero");

  const spans = getSpans();
  assertEquals(spans[0].name, "game.createGame");
  assertEquals(spans[0].ended, true);
});

Deno.test("createGame span sets game.id and player.name attributes", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  await service.createGame("Hero");

  const spans = getSpans();
  assertEquals(typeof spans[0].attributes["game.id"], "string");
  assertEquals(spans[0].attributes["player.name"], "Hero");
});

Deno.test("submitAction creates a span named game.submitAction", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  const view = await service.createGame("Hero");
  const spansBefore = getSpans().length;
  await service.submitAction(view.gameId, { type: "draw_card" });

  const spans = getSpans();
  const submitSpan = spans.slice(spansBefore).find((s) =>
    s.name === "game.submitAction"
  );
  assertEquals(submitSpan !== undefined, true);
  assertEquals(submitSpan!.ended, true);
});

Deno.test("submitAction span sets game.id and action.type attributes", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  const view = await service.createGame("Hero");
  const spansBefore = getSpans().length;
  await service.submitAction(view.gameId, { type: "draw_card" });

  const spans = getSpans();
  const submitSpan = spans.slice(spansBefore).find((s) =>
    s.name === "game.submitAction"
  );
  assertEquals(submitSpan!.attributes["game.id"], view.gameId);
  assertEquals(submitSpan!.attributes["action.type"], "draw_card");
});

Deno.test("submitAction span sets game.completed attribute after normal action", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  const view = await service.createGame("Hero");
  const spansBefore = getSpans().length;
  await service.submitAction(view.gameId, { type: "draw_card" });

  const spans = getSpans();
  const submitSpan = spans.slice(spansBefore).find((s) =>
    s.name === "game.submitAction"
  );
  assertEquals(submitSpan!.attributes["game.completed"], false);
});

Deno.test("getGame creates a span named game.getGame", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  const view = await service.createGame("Hero");
  const spansBefore = getSpans().length;
  await service.getGame(view.gameId);

  const spans = getSpans();
  const getSpan = spans.slice(spansBefore).find((s) =>
    s.name === "game.getGame"
  );
  assertEquals(getSpan !== undefined, true);
  assertEquals(getSpan!.ended, true);
  assertEquals(getSpan!.attributes["game.id"], view.gameId);
});

Deno.test("getEventLog creates a span named game.getEventLog", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const storedEvents = new Map<string, StoredEvent[]>();
  const repository = createMockRepository(storedEvents);
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  const view = await service.createGame("Hero");
  await repository.updateStatus(view.gameId, "completed", 10);
  const spansBefore = getSpans().length;
  await service.getEventLog(view.gameId);

  const spans = getSpans();
  const logSpan = spans.slice(spansBefore).find((s) =>
    s.name === "game.getEventLog"
  );
  assertEquals(logSpan !== undefined, true);
  assertEquals(logSpan!.ended, true);
  assertEquals(logSpan!.attributes["game.id"], view.gameId);
});

Deno.test("getLeaderboard creates a span named game.getLeaderboard", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  const spansBefore = getSpans().length;
  await service.getLeaderboard();

  const spans = getSpans();
  const lbSpan = spans.slice(spansBefore).find((s) =>
    s.name === "game.getLeaderboard"
  );
  assertEquals(lbSpan !== undefined, true);
  assertEquals(lbSpan!.ended, true);
});

Deno.test("getLeaderboardEntry creates a span named game.getLeaderboardEntry", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const repository = createMockRepository();
  const engine = createMockEngine();
  const service = createGameService(engine, repository, TEST_CONFIG, tracer);

  const spansBefore = getSpans().length;
  await service.getLeaderboardEntry(GAME_ID);

  const spans = getSpans();
  const lbSpan = spans.slice(spansBefore).find((s) =>
    s.name === "game.getLeaderboardEntry"
  );
  assertEquals(lbSpan !== undefined, true);
  assertEquals(lbSpan!.ended, true);
  assertEquals(lbSpan!.attributes["game.id"], GAME_ID);
});

Deno.test("submitAction creates autoEnterRoom child span when phase is room_ready", async () => {
  const { tracer, getSpans } = createSpyTracer();

  const roomReadyState: GameState = {
    ...makeInitialState(),
    room: [
      { suit: "clubs", rank: 3 },
      { suit: "clubs", rank: 5 },
      { suit: "clubs", rank: 7 },
      { suit: "clubs", rank: 9 },
    ],
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
      const choosingState: GameState = {
        ...roomReadyState,
        phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
      };
      const event = makeActionEvent(
        eventLog.events.length,
        action,
        choosingState,
      );
      return {
        ok: true,
        state: choosingState,
        event,
        eventLog: { gameId: GAME_ID, events: [...eventLog.events, event] },
      };
    },
  });

  const service = createGameService(engine, repository, TEST_CONFIG, tracer);
  await service.submitAction(GAME_ID, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });

  const spans = getSpans();
  const autoEnterSpan = spans.find((s) =>
    s.name === "game.submitAction.autoEnterRoom"
  );
  assertEquals(autoEnterSpan !== undefined, true);
  assertEquals(autoEnterSpan!.ended, true);
});
