import { assertEquals } from "@std/assert";
import { computeFightOverlayData } from "./fight_overlay_utils.ts";
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
    turnNumber: 1,
    lastRoomAvoided: false,
    lastCardPlayed: null,
    ...overrides,
  };
}

const monster6: Card = { suit: "clubs", rank: 6 };
const monster12: Card = { suit: "spades", rank: 12 };
const weapon5: Card = { suit: "diamonds", rank: 5 };

Deno.test("no weapon equipped: canUseWeapon is false", () => {
  const state = makeState({ equippedWeapon: null });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.canUseWeapon, false);
});

Deno.test("no weapon equipped: weaponDamage is 0", () => {
  const state = makeState({ equippedWeapon: null });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.weaponDamage, 0);
});

Deno.test("no weapon equipped: barehandedDamage equals monster rank", () => {
  const state = makeState({ equippedWeapon: null });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.barehandedDamage, 6);
});

Deno.test("weapon equipped with no slain: canUseWeapon is true", () => {
  const state = makeState({
    equippedWeapon: { card: weapon5, slainMonsters: [] },
  });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.canUseWeapon, true);
});

Deno.test("weapon equipped: weaponDamage is max(0, monster - weapon)", () => {
  const state = makeState({
    equippedWeapon: { card: weapon5, slainMonsters: [] },
  });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.weaponDamage, 1);
});

Deno.test("weapon stronger than monster: weaponDamage is 0", () => {
  const weapon8: Card = { suit: "diamonds", rank: 8 };
  const state = makeState({
    equippedWeapon: { card: weapon8, slainMonsters: [] },
  });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.weaponDamage, 0);
});

Deno.test("weapon blocked by last slain: canUseWeapon is false", () => {
  const slain3: Card = { suit: "clubs", rank: 3 };
  const state = makeState({
    equippedWeapon: { card: weapon5, slainMonsters: [slain3] },
  });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.canUseWeapon, false);
});

Deno.test("weapon usable when monster rank <= last slain rank", () => {
  const state = makeState({
    equippedWeapon: { card: weapon5, slainMonsters: [monster12] },
  });
  const result = computeFightOverlayData(state, monster6);
  assertEquals(result.canUseWeapon, true);
});
