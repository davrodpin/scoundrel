import { assertEquals } from "@std/assert";
import { computeTooltip } from "./tooltip_utils.ts";
import type { Card, GameState } from "@scoundrel/engine";

function makeState(overrides: Partial<GameState> = {}): GameState {
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

// --- Monster tooltips ---

Deno.test("monster with no weapon shows barehanded damage", () => {
  const monster: Card = { suit: "clubs", rank: 7 };
  const state = makeState();
  assertEquals(computeTooltip(monster, state), ["Barehanded: 7 dmg"]);
});

Deno.test("monster with weapon eligible (no slain) shows weapon and barehanded", () => {
  const monster: Card = { suit: "spades", rank: 10 };
  const weapon: Card = { suit: "diamonds", rank: 5 };
  const state = makeState({
    equippedWeapon: { card: weapon, slainMonsters: [] },
  });
  assertEquals(computeTooltip(monster, state), [
    "Weapon: 5 dmg",
    "Barehanded: 10 dmg",
  ]);
});

Deno.test("monster with weapon eligible shows no damage when weapon rank >= monster rank", () => {
  const monster: Card = { suit: "clubs", rank: 3 };
  const weapon: Card = { suit: "diamonds", rank: 5 };
  const state = makeState({
    equippedWeapon: { card: weapon, slainMonsters: [] },
  });
  assertEquals(computeTooltip(monster, state), [
    "Weapon: no damage",
    "Barehanded: 3 dmg",
  ]);
});

Deno.test("monster with weapon eligible when monster rank <= last slain rank", () => {
  const monster: Card = { suit: "clubs", rank: 6 };
  const weapon: Card = { suit: "diamonds", rank: 5 };
  const lastSlain: Card = { suit: "spades", rank: 12 };
  const state = makeState({
    equippedWeapon: { card: weapon, slainMonsters: [lastSlain] },
  });
  assertEquals(computeTooltip(monster, state), [
    "Weapon: 1 dmg",
    "Barehanded: 6 dmg",
  ]);
});

Deno.test("monster with weapon blocked when monster rank > last slain rank", () => {
  const monster: Card = { suit: "spades", rank: 12 };
  const weapon: Card = { suit: "diamonds", rank: 5 };
  const lastSlain: Card = { suit: "clubs", rank: 6 };
  const state = makeState({
    equippedWeapon: { card: weapon, slainMonsters: [lastSlain] },
  });
  assertEquals(computeTooltip(monster, state), [
    "Barehanded: 12 dmg",
    "Weapon blocked (last slain: 6)",
  ]);
});

// --- Potion tooltips ---

Deno.test("potion shows heal amount", () => {
  const potion: Card = { suit: "hearts", rank: 5 };
  const state = makeState({ health: 15 });
  assertEquals(computeTooltip(potion, state), ["Heals 5 HP"]);
});

Deno.test("potion heals capped at max health", () => {
  const potion: Card = { suit: "hearts", rank: 7 };
  const state = makeState({ health: 17 });
  assertEquals(computeTooltip(potion, state), ["Heals 3 HP"]);
});

Deno.test("potion at full health shows no effect", () => {
  const potion: Card = { suit: "hearts", rank: 5 };
  const state = makeState({ health: 20 });
  assertEquals(computeTooltip(potion, state), [
    "Health full \u2014 no effect",
  ]);
});

Deno.test("potion already used this turn shows no effect", () => {
  const potion: Card = { suit: "hearts", rank: 5 };
  const state = makeState({
    health: 10,
    phase: { kind: "choosing", cardsChosen: 1, potionUsedThisTurn: true },
  });
  assertEquals(computeTooltip(potion, state), [
    "No effect \u2014 potion already used this turn",
  ]);
});

// --- Weapon tooltips ---

Deno.test("weapon with no weapon equipped shows equip", () => {
  const weapon: Card = { suit: "diamonds", rank: 7 };
  const state = makeState();
  assertEquals(computeTooltip(weapon, state), ["Equip (rank 7)"]);
});

Deno.test("weapon upgrade shows positive diff", () => {
  const newWeapon: Card = { suit: "diamonds", rank: 8 };
  const currentWeapon: Card = { suit: "diamonds", rank: 5 };
  const state = makeState({
    equippedWeapon: { card: currentWeapon, slainMonsters: [] },
  });
  assertEquals(computeTooltip(newWeapon, state), ["Equip (rank 8, +3)"]);
});

Deno.test("weapon downgrade shows negative diff with minus sign", () => {
  const newWeapon: Card = { suit: "diamonds", rank: 3 };
  const currentWeapon: Card = { suit: "diamonds", rank: 8 };
  const state = makeState({
    equippedWeapon: { card: currentWeapon, slainMonsters: [] },
  });
  assertEquals(computeTooltip(newWeapon, state), ["Equip (rank 3, \u22125)"]);
});

Deno.test("weapon same rank shows same", () => {
  const newWeapon: Card = { suit: "diamonds", rank: 5 };
  const currentWeapon: Card = { suit: "diamonds", rank: 5 };
  const state = makeState({
    equippedWeapon: { card: currentWeapon, slainMonsters: [] },
  });
  assertEquals(computeTooltip(newWeapon, state), ["Equip (rank 5, same)"]);
});
