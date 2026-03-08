import { assertEquals } from "@std/assert";
import type { GameState } from "./types.ts";
import type { GameAction } from "./actions.ts";
import { validateAction } from "./rules.ts";

function makeState(overrides: Partial<GameState>): GameState {
  return {
    gameId: "test",
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

// --- draw_card ---

Deno.test("draw_card valid when phase is drawing", () => {
  const state = makeState({ phase: { kind: "drawing" } });
  const action: GameAction = { type: "draw_card" };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("draw_card invalid when phase is room_ready", () => {
  const state = makeState({ phase: { kind: "room_ready" } });
  const action: GameAction = { type: "draw_card" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("draw_card invalid when phase is choosing", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const action: GameAction = { type: "draw_card" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("draw_card invalid when phase is game_over", () => {
  const state = makeState({
    phase: { kind: "game_over", reason: "dead" },
  });
  const action: GameAction = { type: "draw_card" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

// --- avoid_room ---

Deno.test("avoid_room valid when phase is room_ready and lastRoomAvoided is false", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    lastRoomAvoided: false,
  });
  const action: GameAction = { type: "avoid_room" };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("avoid_room invalid when phase is not room_ready", () => {
  const state = makeState({ phase: { kind: "drawing" } });
  const action: GameAction = { type: "avoid_room" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("avoid_room invalid when lastRoomAvoided is true", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    lastRoomAvoided: true,
  });
  const action: GameAction = { type: "avoid_room" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

// --- enter_room ---

Deno.test("enter_room valid when phase is room_ready", () => {
  const state = makeState({ phase: { kind: "room_ready" } });
  const action: GameAction = { type: "enter_room" };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("enter_room invalid when phase is drawing", () => {
  const state = makeState({ phase: { kind: "drawing" } });
  const action: GameAction = { type: "enter_room" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("enter_room invalid when phase is choosing", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const action: GameAction = { type: "enter_room" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("enter_room invalid when phase is game_over", () => {
  const state = makeState({
    phase: { kind: "game_over", reason: "dead" },
  });
  const action: GameAction = { type: "enter_room" };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

// --- choose_card ---

Deno.test("choose_card valid when phase is choosing and card exists", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "hearts", rank: 5 }],
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("choose_card invalid when phase is not choosing", () => {
  const state = makeState({
    phase: { kind: "drawing" },
    room: [{ suit: "hearts", rank: 5 }],
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("choose_card invalid when cardIndex is negative", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "hearts", rank: 5 }],
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: -1,
    fightWith: "barehanded",
  };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("choose_card invalid when cardIndex >= room.length", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "hearts", rank: 5 }],
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 1,
    fightWith: "barehanded",
  };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("choose_card with monster + weapon valid when weapon equipped and no prior slain", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "clubs", rank: 8 }],
    equippedWeapon: {
      card: { suit: "diamonds", rank: 5 },
      slainMonsters: [],
    },
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("choose_card with monster + weapon invalid when no weapon equipped", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "clubs", rank: 8 }],
    equippedWeapon: null,
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("choose_card with monster + weapon invalid when monster rank > last slain monster rank", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "clubs", rank: 10 }],
    equippedWeapon: {
      card: { suit: "diamonds", rank: 5 },
      slainMonsters: [{ suit: "spades", rank: 6 }],
    },
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  };
  const result = validateAction(state, action);
  assertEquals(result.valid, false);
});

Deno.test("choose_card with monster + weapon valid when monster rank <= last slain monster rank", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "clubs", rank: 5 }],
    equippedWeapon: {
      card: { suit: "diamonds", rank: 5 },
      slainMonsters: [{ suit: "spades", rank: 6 }],
    },
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("choose_card with monster + barehanded always valid", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "clubs", rank: 14 }],
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("choose_card with weapon card is valid regardless of fightWith", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "diamonds", rank: 7 }],
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  };
  assertEquals(validateAction(state, action), { valid: true });
});

Deno.test("choose_card with potion card is valid regardless of fightWith", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    room: [{ suit: "hearts", rank: 3 }],
  });
  const action: GameAction = {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  };
  assertEquals(validateAction(state, action), { valid: true });
});
