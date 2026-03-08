import { assertEquals, assertNotEquals } from "@std/assert";
import { assertThrows } from "@std/assert";
import { createGameEngine } from "./engine.ts";
import type { GameEngine } from "./engine.ts";
import type { Card } from "./types.ts";
import type { GameAction } from "./actions.ts";
import type { EventLog } from "./events.ts";
import { applyAction } from "./reducer.ts";

/** Helper: draw cards one by one until room is full or dungeon empties. */
function drawFullRoom(
  engine: GameEngine,
  eventLog: EventLog,
): { eventLog: EventLog; state: ReturnType<GameEngine["getState"]> } {
  let log = eventLog;
  let state = engine.getState(log);
  while (
    state.phase.kind === "drawing" && state.room.length < 4 &&
    state.dungeon.length > 0
  ) {
    const r = engine.submitAction(log, { type: "draw_card" });
    if (!r.ok) throw new Error(`draw_card failed: ${r.error}`);
    log = r.eventLog;
    state = r.state;
  }
  return { eventLog: log, state };
}

// ── createGame tests ──────────────────────────────────────────────

Deno.test("createGame - creates game with initial health 20", () => {
  const engine = createGameEngine();
  const { state } = engine.createGame();
  assertEquals(state.health, 20);
});

Deno.test("createGame - creates game with phase drawing", () => {
  const engine = createGameEngine();
  const { state } = engine.createGame();
  assertEquals(state.phase, { kind: "drawing" });
});

Deno.test("createGame - creates game with empty room", () => {
  const engine = createGameEngine();
  const { state } = engine.createGame();
  assertEquals(state.room, []);
});

Deno.test("createGame - creates game with 44-card dungeon when no seed", () => {
  const engine = createGameEngine();
  const { state } = engine.createGame();
  assertEquals(state.dungeon.length, 44);
});

Deno.test("createGame - creates game with seed deck when provided", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 3 },
    { suit: "clubs", rank: 4 },
  ];
  const { state } = engine.createGame(seed);
  assertEquals(state.dungeon.length, 3);
  assertEquals(state.dungeon[0], { suit: "diamonds", rank: 5 });
  assertEquals(state.dungeon[1], { suit: "hearts", rank: 3 });
  assertEquals(state.dungeon[2], { suit: "clubs", rank: 4 });
});

Deno.test("createGame - event log contains one game_created event", () => {
  const engine = createGameEngine();
  const { eventLog } = engine.createGame();
  assertEquals(eventLog.events.length, 1);
  assertEquals(eventLog.events[0].kind, "game_created");
});

Deno.test("createGame - game created event has id 0", () => {
  const engine = createGameEngine();
  const { eventLog } = engine.createGame();
  assertEquals(eventLog.events[0].id, 0);
});

// ── submitAction tests ────────────────────────────────────────────

Deno.test("submitAction - returns ok:true with new state for valid action", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 3 },
    { suit: "clubs", rank: 4 },
    { suit: "spades", rank: 7 },
  ];
  const { eventLog } = engine.createGame(seed);
  const result = engine.submitAction(eventLog, { type: "draw_card" });
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.state.room.length, 1);
    assertEquals(result.state.phase, { kind: "drawing" });
  }
});

Deno.test("submitAction - returns ok:false for invalid action", () => {
  const engine = createGameEngine();
  const { eventLog } = engine.createGame();
  // avoid_room is invalid when phase is "drawing"
  const result = engine.submitAction(eventLog, { type: "avoid_room" });
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertNotEquals(result.error, "");
  }
});

Deno.test("submitAction - returns ok:false for malformed action (Zod parse failure)", () => {
  const engine = createGameEngine();
  const { eventLog } = engine.createGame();
  const result = engine.submitAction(
    eventLog,
    { type: "invalid_action" } as unknown as GameAction,
  );
  assertEquals(result.ok, false);
});

Deno.test("submitAction - appends event to event log", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 3 },
    { suit: "clubs", rank: 4 },
    { suit: "spades", rank: 7 },
  ];
  const { eventLog } = engine.createGame(seed);
  const result = engine.submitAction(eventLog, { type: "draw_card" });
  if (result.ok) {
    assertEquals(result.eventLog.events.length, 2);
  }
});

Deno.test("submitAction - event has sequential id", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 3 },
    { suit: "clubs", rank: 4 },
    { suit: "spades", rank: 7 },
  ];
  const { eventLog } = engine.createGame(seed);
  const result = engine.submitAction(eventLog, { type: "draw_card" });
  if (result.ok) {
    assertEquals(result.event.id, 1);
  }
});

Deno.test("submitAction - state in result matches state after applying action", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 3 },
    { suit: "clubs", rank: 4 },
    { suit: "spades", rank: 7 },
  ];
  const { state, eventLog } = engine.createGame(seed);
  const result = engine.submitAction(eventLog, { type: "draw_card" });
  if (result.ok) {
    const expectedState = applyAction(state, { type: "draw_card" });
    assertEquals(result.state.room, expectedState.room);
    assertEquals(result.state.dungeon, expectedState.dungeon);
    assertEquals(result.state.phase, expectedState.phase);
  }
});

// ── getState tests ────────────────────────────────────────────────

Deno.test("getState - returns initial state from fresh game", () => {
  const engine = createGameEngine();
  const { state, eventLog } = engine.createGame();
  const retrieved = engine.getState(eventLog);
  assertEquals(retrieved, state);
});

Deno.test("getState - returns latest state after actions", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 3 },
    { suit: "clubs", rank: 4 },
    { suit: "spades", rank: 7 },
  ];
  const { eventLog } = engine.createGame(seed);
  const result = engine.submitAction(eventLog, { type: "draw_card" });
  if (result.ok) {
    const retrieved = engine.getState(result.eventLog);
    assertEquals(retrieved, result.state);
  }
});

Deno.test("getState - throws on empty event log", () => {
  const engine = createGameEngine();
  assertThrows(() => {
    engine.getState({ gameId: "test", events: [] });
  });
});

// ── replay tests ──────────────────────────────────────────────────

Deno.test("replay - returns array starting with initial state", () => {
  const engine = createGameEngine();
  const { state, eventLog } = engine.createGame();
  const states = engine.replay(eventLog);
  assertEquals(states[0], state);
});

Deno.test("replay - each state matches applying actions sequentially", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 3 },
    { suit: "clubs", rank: 4 },
    { suit: "spades", rank: 7 },
  ];
  const { eventLog: log0 } = engine.createGame(seed);
  const r1 = engine.submitAction(log0, { type: "draw_card" });
  if (!r1.ok) throw new Error("Expected ok");

  const states = engine.replay(r1.eventLog);
  assertEquals(states.length, 2);
  // The second state should match applying draw_card to the initial state
  const expectedSecond = applyAction(states[0], { type: "draw_card" });
  assertEquals(states[1].room, expectedSecond.room);
  assertEquals(states[1].dungeon, expectedSecond.dungeon);
});

Deno.test("replay - replay of fresh game returns single state", () => {
  const engine = createGameEngine();
  const { eventLog } = engine.createGame();
  const states = engine.replay(eventLog);
  assertEquals(states.length, 1);
});

// ── getScore tests ────────────────────────────────────────────────

Deno.test("getScore - delegates to calculateScore", () => {
  const engine = createGameEngine();
  const { state } = engine.createGame();
  // In-progress game should return current health
  assertEquals(engine.getScore(state), 20);
});

// ── Integration test ──────────────────────────────────────────────

Deno.test("integration - play a complete mini-game", () => {
  const engine = createGameEngine();
  const seed: Card[] = [
    // Room 1 (4 cards)
    { suit: "diamonds", rank: 5 }, // weapon
    { suit: "hearts", rank: 3 }, // potion
    { suit: "clubs", rank: 4 }, // monster
    { suit: "spades", rank: 7 }, // monster
    // Room 2 (1 leftover + 3 more)
    { suit: "diamonds", rank: 8 }, // weapon
    { suit: "clubs", rank: 10 }, // monster
    { suit: "hearts", rank: 6 }, // potion
    { suit: "spades", rank: 3 }, // monster
  ];

  const { eventLog: log0 } = engine.createGame(seed);

  // Draw room 1 card by card
  const r1 = drawFullRoom(engine, log0);
  assertEquals(r1.state.room.length, 4);
  assertEquals(r1.state.phase, { kind: "room_ready" });

  // Enter room to start choosing
  const r2 = engine.submitAction(r1.eventLog, { type: "enter_room" });
  if (!r2.ok) throw new Error(`enter_room failed: ${r2.error}`);
  assertEquals(r2.state.phase, {
    kind: "choosing",
    cardsChosen: 0,
    potionUsedThisTurn: false,
  });

  // Choose weapon (diamond 5) — equip it
  const r3 = engine.submitAction(r2.eventLog, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  if (!r3.ok) throw new Error(`choose weapon failed: ${r3.error}`);
  assertEquals(r3.state.equippedWeapon?.card, { suit: "diamonds", rank: 5 });
  assertEquals(r3.state.room.length, 3);

  // Choose potion (hearts 3) — heal (no effect at 20 health)
  const r4 = engine.submitAction(r3.eventLog, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  if (!r4.ok) throw new Error(`choose potion failed: ${r4.error}`);
  assertEquals(r4.state.health, 20);
  assertEquals(r4.state.room.length, 2);

  // Choose monster (clubs 4) with weapon — damage = max(0, 4-5) = 0
  const r5 = engine.submitAction(r4.eventLog, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  });
  if (!r5.ok) throw new Error(`choose monster failed: ${r5.error}`);
  assertEquals(r5.state.health, 20);
  assertEquals(r5.state.equippedWeapon?.slainMonsters.length, 1);
  assertEquals(r5.state.room.length, 1); // 1 card left over
  assertEquals(r5.state.phase, { kind: "drawing" }); // turn complete

  // Draw room 2 (1 leftover + 3 new from dungeon)
  const r6 = drawFullRoom(engine, r5.eventLog);
  assertEquals(r6.state.room.length, 4);
  assertEquals(r6.state.phase, { kind: "room_ready" });

  // Avoid room 2
  const r7 = engine.submitAction(r6.eventLog, { type: "avoid_room" });
  if (!r7.ok) throw new Error(`avoid_room failed: ${r7.error}`);
  assertEquals(r7.state.phase, { kind: "drawing" });
  assertEquals(r7.state.lastRoomAvoided, true);

  // Draw again
  const r8 = drawFullRoom(engine, r7.eventLog);
  if (r8.state.phase.kind !== "room_ready") {
    throw new Error(`Expected room_ready but got ${r8.state.phase.kind}`);
  }

  // Can't avoid again (two in a row)
  const r9 = engine.submitAction(r8.eventLog, { type: "avoid_room" });
  assertEquals(r9.ok, false);

  // Verify replay consistency
  const replayStates = engine.replay(r8.eventLog);
  assertEquals(replayStates.length, r8.eventLog.events.length);
});
