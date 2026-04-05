import { assertEquals } from "@std/assert";
import { getActionBarHint } from "./ActionBar.tsx";
import type { GamePhase } from "@scoundrel/engine";
import type { ActionPanelState } from "./action_panel_utils.ts";

const noButton: ActionPanelState["fightWithWeapon"] = {
  enabled: false,
  tooltip: "",
};

const disabledPanel: ActionPanelState = {
  avoidRoom: { enabled: false },
  fightWithWeapon: noButton,
  fightBarehanded: noButton,
  equipWeapon: noButton,
  drinkPotion: noButton,
};

function panelWith(overrides: Partial<ActionPanelState>): ActionPanelState {
  return { ...disabledPanel, ...overrides };
}

Deno.test("getActionBarHint - drawing phase with empty room", () => {
  const phase: GamePhase = { kind: "drawing" };
  assertEquals(
    getActionBarHint(phase, false, false, 0),
    "Draw a card (D) or Fill Room (F)",
  );
});

Deno.test("getActionBarHint - drawing phase with cards already in room", () => {
  const phase: GamePhase = { kind: "drawing" };
  assertEquals(
    getActionBarHint(phase, false, false, 2),
    "Draw another card (D) or Fill Room (F)",
  );
});

Deno.test("getActionBarHint - room_ready when lastRoomAvoided is false", () => {
  const phase: GamePhase = { kind: "room_ready" };
  assertEquals(
    getActionBarHint(phase, false, false, 0),
    "Select a card to play (←→ ↩︎) or Avoid Room (A)",
  );
});

Deno.test("getActionBarHint - room_ready when lastRoomAvoided is true", () => {
  const phase: GamePhase = { kind: "room_ready" };
  assertEquals(
    getActionBarHint(phase, true, false, 0),
    "Select a card to play (←→ ↩︎)",
  );
});

Deno.test("getActionBarHint - room_ready monster selected, weapon can fight, can avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    avoidRoom: { enabled: true },
    fightWithWeapon: { enabled: true, tooltip: "Weapon: 4 dmg" },
    fightBarehanded: { enabled: true, tooltip: "Barehanded: 8 dmg" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Avoid Room (A), Fight w/ Weapon (W): 4 dmg, Barehanded (B): 8 dmg, or select another card",
  );
});

Deno.test("getActionBarHint - room_ready monster selected, weapon no damage, can avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    avoidRoom: { enabled: true },
    fightWithWeapon: { enabled: true, tooltip: "Weapon: no damage" },
    fightBarehanded: { enabled: true, tooltip: "Barehanded: 8 dmg" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Avoid Room (A), Fight w/ Weapon (W): no damage, Barehanded (B): 8 dmg, or select another card",
  );
});

Deno.test("getActionBarHint - room_ready monster selected, no weapon, can avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    avoidRoom: { enabled: true },
    fightBarehanded: { enabled: true, tooltip: "Barehanded: 8 dmg" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Avoid Room (A), Fight Barehanded (B): 8 dmg, or select another card",
  );
});

Deno.test("getActionBarHint - room_ready monster selected, weapon can fight, can't avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    fightWithWeapon: { enabled: true, tooltip: "Weapon: 4 dmg" },
    fightBarehanded: { enabled: true, tooltip: "Barehanded: 8 dmg" },
  });
  assertEquals(
    getActionBarHint(phase, true, true, 0, panelState),
    "Card selected. Fight w/ Weapon (W): 4 dmg, Barehanded (B): 8 dmg, or select another card",
  );
});

Deno.test("getActionBarHint - room_ready monster selected, no weapon, can't avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    fightBarehanded: { enabled: true, tooltip: "Barehanded: 8 dmg" },
  });
  assertEquals(
    getActionBarHint(phase, true, true, 0, panelState),
    "Card selected. Fight Barehanded (B): 8 dmg or select another card",
  );
});

Deno.test("getActionBarHint - room_ready weapon selected, can avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    avoidRoom: { enabled: true },
    equipWeapon: { enabled: true, tooltip: "Equip (rank 5, +2)" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Avoid Room (A), Equip Weapon (E), or select another card",
  );
});

Deno.test("getActionBarHint - room_ready weapon selected, can't avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    equipWeapon: { enabled: true, tooltip: "Equip (rank 5, +2)" },
  });
  assertEquals(
    getActionBarHint(phase, true, true, 0, panelState),
    "Card selected. Equip Weapon (E) or select another card",
  );
});

Deno.test("getActionBarHint - room_ready potion selected, can avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    avoidRoom: { enabled: true },
    drinkPotion: { enabled: true, tooltip: "Heals 5 HP" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Avoid Room (A), Drink Potion (P): +5 HP, or select another card",
  );
});

Deno.test("getActionBarHint - room_ready potion selected, can't avoid", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    drinkPotion: { enabled: true, tooltip: "Heals 3 HP" },
  });
  assertEquals(
    getActionBarHint(phase, true, true, 0, panelState),
    "Card selected. Drink Potion (P): +3 HP or select another card",
  );
});

Deno.test("getActionBarHint - room_ready second potion (0 HP)", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    drinkPotion: {
      enabled: true,
      tooltip: "No effect \u2014 potion already used this turn",
    },
  });
  assertEquals(
    getActionBarHint(phase, true, true, 0, panelState),
    "Card selected. Drink Potion (P): 0 HP or select another card",
  );
});

Deno.test("getActionBarHint - room_ready potion selected, health full (0 HP)", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    drinkPotion: { enabled: true, tooltip: "Health full \u2014 no effect" },
  });
  assertEquals(
    getActionBarHint(phase, true, true, 0, panelState),
    "Card selected. Drink Potion (P): 0 HP or select another card",
  );
});

Deno.test("getActionBarHint - choosing phase with no card selected", () => {
  const phase: GamePhase = {
    kind: "choosing",
    cardsChosen: 2,
    potionUsedThisTurn: false,
  };
  assertEquals(
    getActionBarHint(phase, false, false, 0),
    "Select a card to play (←→ ↩︎)",
  );
});

Deno.test("getActionBarHint - choosing phase monster selected (no avoid)", () => {
  const phase: GamePhase = {
    kind: "choosing",
    cardsChosen: 1,
    potionUsedThisTurn: false,
  };
  const panelState = panelWith({
    fightWithWeapon: { enabled: true, tooltip: "Weapon: 4 dmg" },
    fightBarehanded: { enabled: true, tooltip: "Barehanded: 8 dmg" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Fight w/ Weapon (W): 4 dmg, Barehanded (B): 8 dmg, or select another card",
  );
});

Deno.test("getActionBarHint - choosing phase weapon selected (no avoid)", () => {
  const phase: GamePhase = {
    kind: "choosing",
    cardsChosen: 1,
    potionUsedThisTurn: false,
  };
  const panelState = panelWith({
    equipWeapon: { enabled: true, tooltip: "Equip (rank 5, +2)" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Equip Weapon (E) or select another card",
  );
});

Deno.test("getActionBarHint - choosing phase potion selected (no avoid)", () => {
  const phase: GamePhase = {
    kind: "choosing",
    cardsChosen: 1,
    potionUsedThisTurn: false,
  };
  const panelState = panelWith({
    drinkPotion: { enabled: true, tooltip: "Heals 7 HP" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState),
    "Card selected. Drink Potion (P): +7 HP or select another card",
  );
});

Deno.test("getActionBarHint - game_over phase", () => {
  const phase: GamePhase = {
    kind: "game_over",
    reason: "dungeon_cleared",
  };
  assertEquals(
    getActionBarHint(phase, false, false, 0),
    "Game Over",
  );
});

// mobileMode: true — simplified hints only, no card-selected action details, no "or Avoid Room"
Deno.test("getActionBarHint - mobileMode, drawing phase empty room", () => {
  const phase: GamePhase = { kind: "drawing" };
  assertEquals(
    getActionBarHint(phase, false, false, 0, undefined, true),
    "Draw a card or Fill Room",
  );
});

Deno.test("getActionBarHint - mobileMode, drawing phase with cards in room", () => {
  const phase: GamePhase = { kind: "drawing" };
  assertEquals(
    getActionBarHint(phase, false, false, 2, undefined, true),
    "Draw another card or Fill Room",
  );
});

Deno.test("getActionBarHint - mobileMode, room_ready, not lastRoomAvoided — no Avoid Room suffix", () => {
  const phase: GamePhase = { kind: "room_ready" };
  assertEquals(
    getActionBarHint(phase, false, false, 0, undefined, true),
    "Select a card to play",
  );
});

Deno.test("getActionBarHint - mobileMode, room_ready, lastRoomAvoided", () => {
  const phase: GamePhase = { kind: "room_ready" };
  assertEquals(
    getActionBarHint(phase, true, false, 0, undefined, true),
    "Select a card to play",
  );
});

Deno.test("getActionBarHint - mobileMode, card selected with full panelState — returns select hint not action details", () => {
  const phase: GamePhase = { kind: "room_ready" };
  const panelState = panelWith({
    avoidRoom: { enabled: true },
    fightWithWeapon: { enabled: true, tooltip: "Weapon: 4 dmg" },
    fightBarehanded: { enabled: true, tooltip: "Barehanded: 8 dmg" },
  });
  assertEquals(
    getActionBarHint(phase, false, true, 0, panelState, true),
    "Select a card to play",
  );
});

Deno.test("getActionBarHint - mobileMode, choosing phase, no card selected", () => {
  const phase: GamePhase = {
    kind: "choosing",
    cardsChosen: 1,
    potionUsedThisTurn: false,
  };
  assertEquals(
    getActionBarHint(phase, false, false, 0, undefined, true),
    "Select a card to play",
  );
});
