import { assertEquals } from "@std/assert";
import { computeActionPanel } from "./action_panel_utils.ts";
import type { Card, EquippedWeapon, GamePhase } from "@scoundrel/engine";

type ActionPanelInput = {
  phase: GamePhase;
  lastRoomAvoided: boolean;
  room: readonly Card[];
  equippedWeapon: EquippedWeapon | null;
  health: number;
};

function makeState(
  overrides: Partial<ActionPanelInput> = {},
): ActionPanelInput {
  return {
    phase: { kind: "room_ready" },
    lastRoomAvoided: false,
    room: [],
    equippedWeapon: null,
    health: 20,
    ...overrides,
  };
}

const monster6: Card = { suit: "clubs", rank: 6 };
const monster12: Card = { suit: "spades", rank: 12 };
const weapon5: Card = { suit: "diamonds", rank: 5 };
const potion4: Card = { suit: "hearts", rank: 4 };

// --- Avoid Room ---

Deno.test("avoidRoom enabled when room_ready and not lastRoomAvoided", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    lastRoomAvoided: false,
  });
  const result = computeActionPanel(state, null);
  assertEquals(result.avoidRoom.enabled, true);
});

Deno.test("avoidRoom disabled when lastRoomAvoided is true", () => {
  const state = makeState({
    phase: { kind: "room_ready" },
    lastRoomAvoided: true,
  });
  const result = computeActionPanel(state, null);
  assertEquals(result.avoidRoom.enabled, false);
});

Deno.test("avoidRoom disabled when phase is choosing", () => {
  const state = makeState({
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    lastRoomAvoided: false,
  });
  const result = computeActionPanel(state, null);
  assertEquals(result.avoidRoom.enabled, false);
});

// --- No selection ---

Deno.test("all card-action buttons disabled when no card selected", () => {
  const state = makeState({ room: [monster6, weapon5, potion4] });
  const result = computeActionPanel(state, null);
  assertEquals(result.fightWithWeapon.enabled, false);
  assertEquals(result.fightBarehanded.enabled, false);
  assertEquals(result.equipWeapon.enabled, false);
  assertEquals(result.drinkPotion.enabled, false);
});

// --- Monster selected ---

Deno.test("fightBarehanded enabled when monster selected", () => {
  const state = makeState({ room: [monster6] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightBarehanded.enabled, true);
});

Deno.test("fightBarehanded tooltip shows damage when monster selected", () => {
  const state = makeState({ room: [monster6] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightBarehanded.tooltip, "Barehanded: 6 dmg");
});

Deno.test("fightWithWeapon disabled when monster selected but no weapon", () => {
  const state = makeState({ room: [monster6], equippedWeapon: null });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.enabled, false);
});

Deno.test("fightWithWeapon enabled when monster selected and weapon equipped (no slain)", () => {
  const state = makeState({
    room: [monster6],
    equippedWeapon: { card: weapon5, slainMonsters: [] },
  });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.enabled, true);
});

Deno.test("fightWithWeapon tooltip shows weapon damage", () => {
  const state = makeState({
    room: [monster6],
    equippedWeapon: { card: weapon5, slainMonsters: [] },
  });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.tooltip, "Weapon: 1 dmg");
});

Deno.test("fightWithWeapon tooltip shows no damage when weapon > monster", () => {
  const weapon8: Card = { suit: "diamonds", rank: 8 };
  const state = makeState({
    room: [monster6],
    equippedWeapon: { card: weapon8, slainMonsters: [] },
  });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.tooltip, "Weapon: no damage");
});

Deno.test("fightWithWeapon disabled when weapon blocked by last slain", () => {
  const slain3: Card = { suit: "clubs", rank: 3 };
  const state = makeState({
    room: [monster6],
    equippedWeapon: { card: weapon5, slainMonsters: [slain3] },
  });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.enabled, false);
});

Deno.test("fightWithWeapon enabled when monster rank <= last slain rank", () => {
  const state = makeState({
    room: [monster6],
    equippedWeapon: { card: weapon5, slainMonsters: [monster12] },
  });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.enabled, true);
});

Deno.test("equipWeapon disabled when monster selected", () => {
  const state = makeState({ room: [monster6] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.equipWeapon.enabled, false);
});

Deno.test("drinkPotion disabled when monster selected", () => {
  const state = makeState({ room: [monster6] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.drinkPotion.enabled, false);
});

// --- Weapon selected ---

Deno.test("equipWeapon enabled when weapon card selected", () => {
  const state = makeState({ room: [weapon5] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.equipWeapon.enabled, true);
});

Deno.test("equipWeapon tooltip shows rank info", () => {
  const state = makeState({ room: [weapon5] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.equipWeapon.tooltip, "Equip (rank 5)");
});

Deno.test("fightWithWeapon disabled when weapon card selected", () => {
  const state = makeState({ room: [weapon5] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.enabled, false);
});

Deno.test("fightBarehanded disabled when weapon card selected", () => {
  const state = makeState({ room: [weapon5] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightBarehanded.enabled, false);
});

Deno.test("drinkPotion disabled when weapon card selected", () => {
  const state = makeState({ room: [weapon5] });
  const result = computeActionPanel(state, 0);
  assertEquals(result.drinkPotion.enabled, false);
});

// --- Potion selected ---

Deno.test("drinkPotion enabled when potion card selected", () => {
  const state = makeState({ room: [potion4], health: 15 });
  const result = computeActionPanel(state, 0);
  assertEquals(result.drinkPotion.enabled, true);
});

Deno.test("drinkPotion tooltip shows heal amount", () => {
  const state = makeState({ room: [potion4], health: 15 });
  const result = computeActionPanel(state, 0);
  assertEquals(result.drinkPotion.tooltip, "Heals 4 HP");
});

Deno.test("drinkPotion tooltip shows no effect when health full", () => {
  const state = makeState({ room: [potion4], health: 20 });
  const result = computeActionPanel(state, 0);
  assertEquals(result.drinkPotion.tooltip, "Health full \u2014 no effect");
});

Deno.test("drinkPotion tooltip shows no effect when potion already used", () => {
  const state = makeState({
    room: [potion4],
    health: 15,
    phase: { kind: "choosing", cardsChosen: 1, potionUsedThisTurn: true },
  });
  const result = computeActionPanel(state, 0);
  assertEquals(
    result.drinkPotion.tooltip,
    "No effect \u2014 potion already used this turn",
  );
});

Deno.test("fightWithWeapon disabled when potion card selected", () => {
  const state = makeState({ room: [potion4], health: 15 });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightWithWeapon.enabled, false);
});

Deno.test("fightBarehanded disabled when potion card selected", () => {
  const state = makeState({ room: [potion4], health: 15 });
  const result = computeActionPanel(state, 0);
  assertEquals(result.fightBarehanded.enabled, false);
});

Deno.test("equipWeapon disabled when potion card selected", () => {
  const state = makeState({ room: [potion4], health: 15 });
  const result = computeActionPanel(state, 0);
  assertEquals(result.equipWeapon.enabled, false);
});
