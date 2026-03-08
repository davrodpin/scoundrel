import { assertEquals, assertNotEquals } from "@std/assert";
import type { GameState } from "./types.ts";
import type { GameAction } from "./actions.ts";
import {
  appendEvent,
  createActionAppliedEvent,
  createGameCreatedEvent,
  type EventLog,
  type GameEvent,
} from "./events.ts";

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: "test-game-1",
    health: 20,
    dungeon: [],
    room: [],
    discard: [],
    equippedWeapon: null,
    phase: { kind: "drawing" },
    lastRoomAvoided: false,
    turnNumber: 1,
    lastCardPlayed: null,
    ...overrides,
  };
}

function makeEventLog(
  gameId: string,
  events: readonly GameEvent[] = [],
): EventLog {
  return { gameId, events };
}

Deno.test("createGameCreatedEvent sets id to 0", () => {
  const state = makeGameState();
  const event = createGameCreatedEvent("game-1", state);
  assertEquals(event.id, 0);
});

Deno.test("createGameCreatedEvent sets kind to 'game_created'", () => {
  const state = makeGameState();
  const event = createGameCreatedEvent("game-1", state);
  assertEquals(event.kind, "game_created");
});

Deno.test("createGameCreatedEvent stores gameId and initialState", () => {
  const state = makeGameState({ health: 15 });
  const event = createGameCreatedEvent("game-42", state);
  assertEquals(event.gameId, "game-42");
  assertEquals(event.initialState, state);
});

Deno.test("createGameCreatedEvent sets timestamp as valid ISO 8601 UTC string", () => {
  const before = new Date().toISOString();
  const state = makeGameState();
  const event = createGameCreatedEvent("game-1", state);
  const after = new Date().toISOString();

  // Timestamp should be a valid ISO 8601 string
  const parsed = new Date(event.timestamp);
  assertEquals(isNaN(parsed.getTime()), false);

  // Timestamp should end with Z (UTC)
  assertEquals(event.timestamp.endsWith("Z"), true);

  // Timestamp should be between before and after
  assertEquals(event.timestamp >= before, true);
  assertEquals(event.timestamp <= after, true);
});

Deno.test("createActionAppliedEvent assigns sequential id based on eventLog length", () => {
  const state = makeGameState();
  const createdEvent = createGameCreatedEvent("game-1", state);
  const log = makeEventLog("game-1", [createdEvent]);

  const action: GameAction = { type: "draw_card" };
  const newState = makeGameState({ turnNumber: 2 });
  const event = createActionAppliedEvent(log, action, newState);

  assertEquals(event.id, 1);
});

Deno.test("createActionAppliedEvent sets kind to 'action_applied'", () => {
  const state = makeGameState();
  const log = makeEventLog("game-1", [createGameCreatedEvent("game-1", state)]);

  const action: GameAction = { type: "avoid_room" };
  const event = createActionAppliedEvent(log, action, state);

  assertEquals(event.kind, "action_applied");
});

Deno.test("createActionAppliedEvent stores action and stateAfter", () => {
  const state = makeGameState();
  const log = makeEventLog("game-1", [createGameCreatedEvent("game-1", state)]);

  const action: GameAction = {
    type: "choose_card",
    cardIndex: 2,
    fightWith: "weapon",
  };
  const stateAfter = makeGameState({ health: 10 });
  const event = createActionAppliedEvent(log, action, stateAfter);

  assertEquals(event.action, action);
  assertEquals(event.stateAfter, stateAfter);
});

Deno.test("appendEvent returns new EventLog with event added", () => {
  const state = makeGameState();
  const event = createGameCreatedEvent("game-1", state);
  const log = makeEventLog("game-1");

  const newLog = appendEvent(log, event);

  assertEquals(newLog.events.length, 1);
  assertEquals(newLog.events[0], event);
  assertEquals(newLog.gameId, "game-1");
});

Deno.test("appendEvent does not mutate original EventLog", () => {
  const state = makeGameState();
  const event = createGameCreatedEvent("game-1", state);
  const log = makeEventLog("game-1");

  const newLog = appendEvent(log, event);

  assertEquals(log.events.length, 0);
  assertNotEquals(log, newLog);
});

Deno.test("Sequential event creation produces incrementing IDs (0, 1, 2, ...)", () => {
  const state = makeGameState();

  // Event 0: game created
  const event0 = createGameCreatedEvent("game-1", state);
  assertEquals(event0.id, 0);

  let log = makeEventLog("game-1");
  log = appendEvent(log, event0);

  // Event 1: draw room
  const action1: GameAction = { type: "draw_card" };
  const state1 = makeGameState({ turnNumber: 1 });
  const event1 = createActionAppliedEvent(log, action1, state1);
  assertEquals(event1.id, 1);
  log = appendEvent(log, event1);

  // Event 2: choose card
  const action2: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  };
  const state2 = makeGameState({ health: 15 });
  const event2 = createActionAppliedEvent(log, action2, state2);
  assertEquals(event2.id, 2);
  log = appendEvent(log, event2);

  assertEquals(log.events.length, 3);
  assertEquals(log.events[0].id, 0);
  assertEquals(log.events[1].id, 1);
  assertEquals(log.events[2].id, 2);
});
