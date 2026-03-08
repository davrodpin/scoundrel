import { assertEquals } from "@std/assert";
import type { GameState } from "@scoundrel/engine";
import { toGameView } from "./view.ts";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: "test-game-id",
    health: 20,
    dungeon: [
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
    ],
    room: [
      { suit: "diamonds", rank: 3 },
      { suit: "hearts", rank: 7 },
    ],
    discard: [{ suit: "clubs", rank: 2 }],
    equippedWeapon: null,
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    lastRoomAvoided: false,
    turnNumber: 1,
    lastCardPlayed: null,
    ...overrides,
  };
}

Deno.test("toGameView strips dungeon to count", () => {
  const state = makeState();
  const view = toGameView(state);
  assertEquals(view.dungeonCount, 2);
  assertEquals(
    (view as Record<string, unknown>)["dungeon"],
    undefined,
  );
});

Deno.test("toGameView strips discard to count", () => {
  const state = makeState();
  const view = toGameView(state);
  assertEquals(view.discardCount, 1);
  assertEquals(
    (view as Record<string, unknown>)["discard"],
    undefined,
  );
});

Deno.test("toGameView preserves room cards", () => {
  const state = makeState();
  const view = toGameView(state);
  assertEquals(view.room, state.room);
});

Deno.test("toGameView preserves health and game metadata", () => {
  const state = makeState({
    health: 15,
    lastRoomAvoided: true,
    turnNumber: 3,
  });
  const view = toGameView(state);
  assertEquals(view.health, 15);
  assertEquals(view.lastRoomAvoided, true);
  assertEquals(view.turnNumber, 3);
  assertEquals(view.gameId, "test-game-id");
});

Deno.test("toGameView preserves equipped weapon", () => {
  const weapon = {
    card: { suit: "diamonds" as const, rank: 5 as const },
    slainMonsters: [{ suit: "clubs" as const, rank: 3 as const }],
  };
  const state = makeState({ equippedWeapon: weapon });
  const view = toGameView(state);
  assertEquals(view.equippedWeapon, weapon);
});

Deno.test("toGameView preserves phase", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 2, potionUsedThisTurn: true },
  });
  const view = toGameView(state);
  assertEquals(view.phase, {
    kind: "choosing",
    cardsChosen: 2,
    potionUsedThisTurn: true,
  });
});

Deno.test("toGameView returns null score when game is in progress", () => {
  const state = makeState();
  const view = toGameView(state);
  assertEquals(view.score, null);
});

Deno.test("toGameView computes score when player is dead", () => {
  const state = makeState({
    health: 0,
    phase: { kind: "game_over", reason: "dead" },
    dungeon: [{ suit: "clubs", rank: 10 }, { suit: "spades", rank: 14 }],
    room: [{ suit: "clubs", rank: 5 }],
    discard: [],
  });
  const view = toGameView(state);
  // Score = health(0) - remaining monsters (10 + 14 + 5 = 29) = -29
  assertEquals(view.score, -29);
});

Deno.test("toGameView computes score when dungeon cleared", () => {
  const state = makeState({
    health: 12,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
    dungeon: [],
    room: [],
    discard: [],
  });
  const view = toGameView(state);
  assertEquals(view.score, 12);
});

Deno.test("toGameView computes bonus score when health is 20 and last card was potion", () => {
  const state = makeState({
    health: 20,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
    dungeon: [],
    room: [],
    discard: [],
    lastCardPlayed: { suit: "hearts", rank: 7 },
  });
  const view = toGameView(state);
  // Score = 20 + 7 = 27
  assertEquals(view.score, 27);
});

Deno.test("toGameView preserves lastCardPlayed", () => {
  const card = { suit: "clubs" as const, rank: 5 as const };
  const state = makeState({ lastCardPlayed: card });
  const view = toGameView(state);
  assertEquals(view.lastCardPlayed, card);
});
