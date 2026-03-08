import { assertEquals } from "@std/assert";
import type { Card, GameState } from "./types.ts";

import { applyAction } from "./reducer.ts";

function makeState(overrides: Partial<GameState>): GameState {
  return {
    gameId: "test",
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

const club3: Card = { suit: "clubs", rank: 3 };
const club5: Card = { suit: "clubs", rank: 5 };
const club6: Card = { suit: "clubs", rank: 6 };
const spade10: Card = { suit: "spades", rank: 10 };
const spadeAce: Card = { suit: "spades", rank: 14 };
const diamond5: Card = { suit: "diamonds", rank: 5 };
const diamond7: Card = { suit: "diamonds", rank: 7 };
const heart4: Card = { suit: "hearts", rank: 4 };
const heart6: Card = { suit: "hearts", rank: 6 };

// =============================================================================
// draw_card tests
// =============================================================================

Deno.test("draw_card: draws 1 card from dungeon into room", () => {
  const state = makeState({
    phase: { kind: "drawing" },
    dungeon: [club3, club5, diamond5, heart4, spade10],
    room: [],
  });
  const result = applyAction(state, { type: "draw_card" });
  assertEquals(result.room, [club3]);
  assertEquals(result.dungeon, [club5, diamond5, heart4, spade10]);
});

Deno.test("draw_card: stays in drawing phase when room has fewer than 4 cards", () => {
  const state = makeState({
    phase: { kind: "drawing" },
    dungeon: [club3, club5, diamond5, heart4],
    room: [],
  });
  const result = applyAction(state, { type: "draw_card" });
  assertEquals(result.phase, { kind: "drawing" });
  assertEquals(result.room.length, 1);
});

Deno.test("draw_card: transitions to room_ready when room reaches 4 cards", () => {
  const state = makeState({
    phase: { kind: "drawing" },
    dungeon: [heart4],
    room: [club3, club5, diamond5],
  });
  const result = applyAction(state, { type: "draw_card" });
  assertEquals(result.room, [club3, club5, diamond5, heart4]);
  assertEquals(result.phase, { kind: "room_ready" });
});

Deno.test("draw_card: transitions to room_ready when dungeon empties before room reaches 4", () => {
  const state = makeState({
    phase: { kind: "drawing" },
    dungeon: [club3],
    room: [club5],
  });
  const result = applyAction(state, { type: "draw_card" });
  assertEquals(result.room, [club5, club3]);
  assertEquals(result.dungeon, []);
  assertEquals(result.phase, { kind: "room_ready" });
});

Deno.test("draw_card: dungeon is empty and room is empty, phase is game_over dungeon_cleared", () => {
  const state = makeState({
    phase: { kind: "drawing" },
    dungeon: [],
    room: [],
  });
  const result = applyAction(state, { type: "draw_card" });
  assertEquals(result.phase, { kind: "game_over", reason: "dungeon_cleared" });
});

// =============================================================================
// avoid_room tests
// =============================================================================

Deno.test("avoid_room: moves all room cards to bottom of dungeon", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    dungeon: [spade10],
    room: [club3, club5, diamond5, heart4],
  });
  const result = applyAction(state, { type: "avoid_room" });
  assertEquals(result.dungeon, [spade10, club3, club5, diamond5, heart4]);
});

Deno.test("avoid_room: clears room", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    dungeon: [],
    room: [club3, club5, diamond5, heart4],
  });
  const result = applyAction(state, { type: "avoid_room" });
  assertEquals(result.room, []);
});

Deno.test("avoid_room: sets lastRoomAvoided to true", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    dungeon: [],
    room: [club3, club5, diamond5, heart4],
    lastRoomAvoided: false,
  });
  const result = applyAction(state, { type: "avoid_room" });
  assertEquals(result.lastRoomAvoided, true);
});

Deno.test("avoid_room: sets phase to drawing", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    dungeon: [],
    room: [club3, club5, diamond5, heart4],
  });
  const result = applyAction(state, { type: "avoid_room" });
  assertEquals(result.phase, { kind: "drawing" });
});

Deno.test("avoid_room: does not change turnNumber", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    dungeon: [],
    room: [club3, club5, diamond5, heart4],
    turnNumber: 3,
  });
  const result = applyAction(state, { type: "avoid_room" });
  assertEquals(result.turnNumber, 3);
});

// =============================================================================
// enter_room tests
// =============================================================================

Deno.test("enter_room: sets phase to choosing with cardsChosen 0", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    room: [club3, club5, diamond5, heart4],
  });
  const result = applyAction(state, { type: "enter_room" });
  assertEquals(result.phase, {
    kind: "choosing",
    cardsChosen: 0,
    potionUsedThisTurn: false,
  });
});

Deno.test("enter_room: does not change room cards", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    room: [club3, club5, diamond5, heart4],
  });
  const result = applyAction(state, { type: "enter_room" });
  assertEquals(result.room, [club3, club5, diamond5, heart4]);
});

Deno.test("enter_room: does not change health", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    room: [club3, club5, diamond5, heart4],
    health: 15,
  });
  const result = applyAction(state, { type: "enter_room" });
  assertEquals(result.health, 15);
});

Deno.test("enter_room: does not change dungeon", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    room: [club3, club5, diamond5, heart4],
    dungeon: [spade10],
  });
  const result = applyAction(state, { type: "enter_room" });
  assertEquals(result.dungeon, [spade10]);
});

// =============================================================================
// choose_card (weapon) tests
// =============================================================================

Deno.test("choose_card weapon: equips the weapon card", () => {
  const state = makeState({
    room: [diamond5, club3, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.equippedWeapon?.card, diamond5);
  assertEquals(result.equippedWeapon?.slainMonsters, []);
});

Deno.test("choose_card weapon: removes card from room", () => {
  const state = makeState({
    room: [diamond5, club3, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.room, [club3, heart4, spade10]);
});

Deno.test("choose_card weapon: discards old weapon and its slain monsters when equipping new weapon", () => {
  const oldWeapon: Card = { suit: "diamonds", rank: 3 };
  const slainMonster: Card = { suit: "clubs", rank: 2 };
  const state = makeState({
    room: [diamond5, club3, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: oldWeapon, slainMonsters: [slainMonster] },
    discard: [],
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.equippedWeapon?.card, diamond5);
  assertEquals(result.discard.includes(oldWeapon), true);
  assertEquals(result.discard.includes(slainMonster), true);
});

Deno.test("choose_card weapon: sets lastCardPlayed to the weapon card", () => {
  const state = makeState({
    room: [diamond5, club3, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.lastCardPlayed, diamond5);
});

// =============================================================================
// choose_card (potion) tests
// =============================================================================

Deno.test("choose_card potion: heals for potion value", () => {
  const state = makeState({
    health: 15,
    room: [heart4, club3, diamond5, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.health, 19);
});

Deno.test("choose_card potion: health cannot exceed 20", () => {
  const state = makeState({
    health: 18,
    room: [heart6, club3, diamond5, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.health, 20);
});

Deno.test("choose_card potion: second potion in same turn is discarded with no healing", () => {
  const state = makeState({
    health: 15,
    room: [heart4, club3, diamond5, spade10],
    phase: { kind: "choosing", cardsChosen: 1, potionUsedThisTurn: true },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.health, 15);
});

Deno.test("choose_card potion: potion card goes to discard", () => {
  const state = makeState({
    health: 15,
    room: [heart4, club3, diamond5, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    discard: [],
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.discard.includes(heart4), true);
});

Deno.test("choose_card potion: sets lastCardPlayed", () => {
  const state = makeState({
    health: 15,
    room: [heart4, club3, diamond5, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.lastCardPlayed, heart4);
});

// =============================================================================
// choose_card (monster, barehanded) tests
// =============================================================================

Deno.test("choose_card monster barehanded: full monster damage subtracted from health", () => {
  const state = makeState({
    health: 20,
    room: [club5, diamond5, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.health, 15);
});

Deno.test("choose_card monster barehanded: monster goes to discard", () => {
  const state = makeState({
    health: 20,
    room: [club5, diamond5, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    discard: [],
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.discard.includes(club5), true);
});

Deno.test("choose_card monster barehanded: health reaching 0 triggers game_over dead", () => {
  const state = makeState({
    health: 5,
    room: [club5, diamond5, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.health, 0);
  assertEquals(result.phase, { kind: "game_over", reason: "dead" });
});

Deno.test("choose_card monster barehanded: sets lastCardPlayed", () => {
  const state = makeState({
    health: 20,
    room: [club5, diamond5, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.lastCardPlayed, club5);
});

// =============================================================================
// choose_card (monster, weapon) tests
// =============================================================================

Deno.test("choose_card monster weapon: damage is max(0, monster_rank - weapon_rank)", () => {
  const state = makeState({
    health: 20,
    room: [spade10, diamond5, heart4, club3],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: diamond5, slainMonsters: [] },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  });
  // damage = max(0, 10 - 5) = 5
  assertEquals(result.health, 15);
});

Deno.test("choose_card monster weapon: monster added to weapon's slainMonsters", () => {
  const state = makeState({
    health: 20,
    room: [spade10, diamond5, heart4, club3],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: diamond7, slainMonsters: [] },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  });
  assertEquals(result.equippedWeapon?.slainMonsters, [spade10]);
});

Deno.test("choose_card monster weapon: no damage when weapon is stronger than monster", () => {
  const state = makeState({
    health: 20,
    room: [club3, diamond5, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: diamond5, slainMonsters: [] },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  });
  // damage = max(0, 3 - 5) = 0
  assertEquals(result.health, 20);
});

Deno.test("choose_card monster weapon: health reaching 0 triggers game_over dead", () => {
  const state = makeState({
    health: 3,
    room: [spadeAce, diamond5, heart4, club3],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: diamond5, slainMonsters: [] },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  });
  // damage = max(0, 14 - 5) = 9, health = 3 - 9 = -6
  assertEquals(result.health, -6);
  assertEquals(result.phase, { kind: "game_over", reason: "dead" });
});

Deno.test("choose_card monster weapon: sets lastCardPlayed", () => {
  const state = makeState({
    health: 20,
    room: [club3, diamond5, heart4, spade10],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: diamond5, slainMonsters: [] },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "weapon",
  });
  assertEquals(result.lastCardPlayed, club3);
});

// =============================================================================
// Turn completion tests
// =============================================================================

Deno.test("turn completion: after 3rd card chosen, phase changes to drawing", () => {
  const state = makeState({
    health: 20,
    room: [heart4, spade10],
    dungeon: [club3],
    phase: { kind: "choosing", cardsChosen: 2, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.phase, { kind: "drawing" });
});

Deno.test("turn completion: after 3rd card chosen, turnNumber increments", () => {
  const state = makeState({
    health: 20,
    room: [heart4, spade10],
    dungeon: [club3],
    phase: { kind: "choosing", cardsChosen: 2, potionUsedThisTurn: false },
    turnNumber: 2,
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.turnNumber, 3);
});

Deno.test("turn completion: after 3rd card chosen, lastRoomAvoided resets to false", () => {
  const state = makeState({
    health: 20,
    room: [heart4, spade10],
    dungeon: [club3],
    phase: { kind: "choosing", cardsChosen: 2, potionUsedThisTurn: false },
    lastRoomAvoided: true,
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.lastRoomAvoided, false);
});

Deno.test("turn completion: after 1st card chosen, phase stays choosing with updated cardsChosen", () => {
  const state = makeState({
    health: 20,
    room: [heart4, club3, diamond5, spade10],
    dungeon: [club6],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.phase, {
    kind: "choosing",
    cardsChosen: 1,
    potionUsedThisTurn: true,
  });
});

Deno.test("turn completion: after 2nd card chosen, phase stays choosing with updated cardsChosen", () => {
  const state = makeState({
    health: 20,
    room: [club3, diamond5, spade10],
    dungeon: [club6],
    phase: { kind: "choosing", cardsChosen: 1, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.phase, {
    kind: "choosing",
    cardsChosen: 2,
    potionUsedThisTurn: false,
  });
});

Deno.test("turn completion: after 3rd card chosen with empty dungeon, phase is game_over dungeon_cleared", () => {
  const state = makeState({
    health: 20,
    room: [heart4, spade10],
    dungeon: [],
    phase: { kind: "choosing", cardsChosen: 2, potionUsedThisTurn: false },
  });
  const result = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.phase, { kind: "game_over", reason: "dungeon_cleared" });
});

Deno.test("turn completion: potionUsedThisTurn persists across choices within same turn", () => {
  // First choose a potion (sets potionUsedThisTurn to true)
  const state = makeState({
    health: 15,
    room: [heart4, club3, diamond5, spade10],
    dungeon: [club6],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const afterPotion = applyAction(state, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(
    (afterPotion.phase as { kind: "choosing"; potionUsedThisTurn: boolean })
      .potionUsedThisTurn,
    true,
  );

  // Now choose a monster — potionUsedThisTurn should still be true
  const afterMonster = applyAction(afterPotion, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(
    (afterMonster.phase as { kind: "choosing"; potionUsedThisTurn: boolean })
      .potionUsedThisTurn,
    true,
  );
});
