import { assertEquals } from "@std/assert";
import { getActionBarHint } from "./ActionBar.tsx";
import type { GamePhase } from "@scoundrel/engine";

Deno.test("getActionBarHint - drawing phase with empty room", () => {
  const phase: GamePhase = { kind: "drawing" };
  assertEquals(
    getActionBarHint(phase, false, false, 0),
    "Draw a card from the Dungeon",
  );
});

Deno.test("getActionBarHint - drawing phase with cards already in room", () => {
  const phase: GamePhase = { kind: "drawing" };
  assertEquals(
    getActionBarHint(phase, false, false, 2),
    "Draw another card from the Dungeon",
  );
});

Deno.test("getActionBarHint - room_ready when lastRoomAvoided is false", () => {
  const phase: GamePhase = { kind: "room_ready" };
  assertEquals(
    getActionBarHint(phase, false, false, 0),
    "Select a card to play — or Avoid Room",
  );
});

Deno.test("getActionBarHint - room_ready when lastRoomAvoided is true", () => {
  const phase: GamePhase = { kind: "room_ready" };
  assertEquals(
    getActionBarHint(phase, true, false, 0),
    "Select a card to play",
  );
});

Deno.test("getActionBarHint - room_ready with card selected", () => {
  const phase: GamePhase = { kind: "room_ready" };
  assertEquals(
    getActionBarHint(phase, false, true, 0),
    "Card selected. Take an action or select another card",
  );
});

Deno.test("getActionBarHint - choosing phase", () => {
  const phase: GamePhase = {
    kind: "choosing",
    cardsChosen: 2,
    potionUsedThisTurn: false,
  };
  assertEquals(
    getActionBarHint(phase, false, false, 0),
    "Select a card to play (2 of 3 chosen)",
  );
});

Deno.test("getActionBarHint - choosing phase with card selected", () => {
  const phase: GamePhase = {
    kind: "choosing",
    cardsChosen: 1,
    potionUsedThisTurn: false,
  };
  assertEquals(
    getActionBarHint(phase, false, true, 0),
    "Card selected. Take an action or select another card",
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
