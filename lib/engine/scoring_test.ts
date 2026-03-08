import { assertEquals } from "@std/assert";
import type { GameState } from "./types.ts";
import { calculateScore } from "./scoring.ts";

function makeState(overrides: Partial<GameState>): GameState {
  return {
    gameId: "test",
    health: 20,
    dungeon: [],
    room: [],
    discard: [],
    equippedWeapon: null,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
    lastRoomAvoided: false,
    turnNumber: 1,
    lastCardPlayed: null,
    ...overrides,
  };
}

Deno.test("dead player: score is health minus remaining dungeon monster values", () => {
  const state = makeState({
    health: -2,
    phase: { kind: "game_over", reason: "dead" },
    dungeon: [
      { suit: "clubs", rank: 5 },
      { suit: "spades", rank: 10 },
    ],
  });
  // score = -2 - (5 + 10) = -17
  assertEquals(calculateScore(state), -17);
});

Deno.test("dead player: non-monster cards in dungeon are not counted", () => {
  const state = makeState({
    health: -3,
    phase: { kind: "game_over", reason: "dead" },
    dungeon: [
      { suit: "clubs", rank: 4 },
      { suit: "diamonds", rank: 8 }, // weapon, not counted
      { suit: "hearts", rank: 6 }, // potion, not counted
    ],
  });
  // score = -3 - 4 = -7
  assertEquals(calculateScore(state), -7);
});

Deno.test("dead player: monsters in room are also subtracted", () => {
  const state = makeState({
    health: -1,
    phase: { kind: "game_over", reason: "dead" },
    dungeon: [
      { suit: "clubs", rank: 3 },
    ],
    room: [
      { suit: "spades", rank: 7 },
      { suit: "diamonds", rank: 5 }, // weapon, not counted
    ],
  });
  // score = -1 - (3 + 7) = -11
  assertEquals(calculateScore(state), -11);
});

Deno.test("dead player with no remaining monsters: score equals health", () => {
  const state = makeState({
    health: -5,
    phase: { kind: "game_over", reason: "dead" },
    dungeon: [
      { suit: "diamonds", rank: 9 },
      { suit: "hearts", rank: 2 },
    ],
    room: [],
  });
  // no monsters remaining, score = -5
  assertEquals(calculateScore(state), -5);
});

Deno.test("survived player: score equals remaining health", () => {
  const state = makeState({
    health: 12,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
  });
  assertEquals(calculateScore(state), 12);
});

Deno.test("perfect score: health=20 and last card was a potion, score = 20 + potion value", () => {
  const state = makeState({
    health: 20,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
    lastCardPlayed: { suit: "hearts", rank: 7 },
  });
  assertEquals(calculateScore(state), 27);
});

Deno.test("perfect score requires health to be exactly 20", () => {
  const state = makeState({
    health: 19,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
    lastCardPlayed: { suit: "hearts", rank: 7 },
  });
  // health is not 20, so no bonus
  assertEquals(calculateScore(state), 19);
});

Deno.test("perfect score requires last card to be a potion, not weapon or monster", () => {
  const weaponState = makeState({
    health: 20,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
    lastCardPlayed: { suit: "diamonds", rank: 7 },
  });
  assertEquals(calculateScore(weaponState), 20);

  const monsterState = makeState({
    health: 20,
    phase: { kind: "game_over", reason: "dungeon_cleared" },
    lastCardPlayed: { suit: "clubs", rank: 7 },
  });
  assertEquals(calculateScore(monsterState), 20);
});

Deno.test("in-progress game: returns current health", () => {
  const drawingState = makeState({
    health: 15,
    phase: { kind: "drawing" },
  });
  assertEquals(calculateScore(drawingState), 15);

  const choosingState = makeState({
    health: 8,
    phase: { kind: "choosing", cardsChosen: 1, potionUsedThisTurn: false },
  });
  assertEquals(calculateScore(choosingState), 8);

  const roomReadyState = makeState({
    health: 20,
    phase: { kind: "room_ready" },
  });
  assertEquals(calculateScore(roomReadyState), 20);
});
