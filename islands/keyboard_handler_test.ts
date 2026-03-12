import { assertEquals } from "@std/assert";
import {
  type ActionKey,
  handleKeyboardEvent,
  type KeyboardIntent,
  type KeyboardState,
} from "./keyboard_handler.ts";

// ─── helpers ───────────────────────────────────────────────────────────────

type StateOverrides =
  & Partial<Omit<KeyboardState, "actions">>
  & { actions?: Partial<Record<ActionKey, boolean>> };

function makeState(overrides: StateOverrides = {}): KeyboardState {
  const { actions, ...rest } = overrides;
  return {
    focusedIndex: null,
    selectedIndex: null,
    occupiedSlots: [0, 1, 2, 3],
    isInteractive: true,
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: false,
      drawCard: false,
      openRules: false,
      copyLink: false,
      openLeaderboard: false,
      ...actions,
    },
    ...rest,
  };
}

function focusCard(index: number): KeyboardIntent {
  return { type: "focus_card", index };
}

// ─── non-interactive guard ─────────────────────────────────────────────────

Deno.test("non-interactive: ArrowRight returns none", () => {
  assertEquals(
    handleKeyboardEvent("ArrowRight", makeState({ isInteractive: false })),
    { type: "none" },
  );
});

Deno.test("non-interactive: Enter returns none", () => {
  assertEquals(
    handleKeyboardEvent(
      "Enter",
      makeState({ isInteractive: false, focusedIndex: 0 }),
    ),
    { type: "none" },
  );
});

Deno.test("non-interactive: action key returns none", () => {
  assertEquals(
    handleKeyboardEvent(
      "w",
      makeState({
        isInteractive: false,
        actions: {
          fightWithWeapon: true,
          avoidRoom: false,
          drinkPotion: false,
          fightBarehanded: false,
          equipWeapon: false,
        },
      }),
    ),
    { type: "none" },
  );
});

// ─── unknown key ────────────────────────────────────────────────────────────

Deno.test("unknown key returns none", () => {
  assertEquals(handleKeyboardEvent("Tab", makeState()), { type: "none" });
  assertEquals(handleKeyboardEvent("Space", makeState()), { type: "none" });
  assertEquals(handleKeyboardEvent("x", makeState()), { type: "none" });
});

// ─── ArrowRight — full room ─────────────────────────────────────────────────

Deno.test("ArrowRight with no focus focuses first occupied slot", () => {
  assertEquals(handleKeyboardEvent("ArrowRight", makeState()), focusCard(0));
});

Deno.test("ArrowRight advances focus to next occupied slot", () => {
  assertEquals(
    handleKeyboardEvent("ArrowRight", makeState({ focusedIndex: 0 })),
    focusCard(1),
  );
  assertEquals(
    handleKeyboardEvent("ArrowRight", makeState({ focusedIndex: 1 })),
    focusCard(2),
  );
  assertEquals(
    handleKeyboardEvent("ArrowRight", makeState({ focusedIndex: 2 })),
    focusCard(3),
  );
});

Deno.test("ArrowRight wraps from last to first occupied slot", () => {
  assertEquals(
    handleKeyboardEvent("ArrowRight", makeState({ focusedIndex: 3 })),
    focusCard(0),
  );
});

// ─── ArrowLeft — full room ──────────────────────────────────────────────────

Deno.test("ArrowLeft with no focus focuses last occupied slot", () => {
  assertEquals(handleKeyboardEvent("ArrowLeft", makeState()), focusCard(3));
});

Deno.test("ArrowLeft moves focus to previous occupied slot", () => {
  assertEquals(
    handleKeyboardEvent("ArrowLeft", makeState({ focusedIndex: 3 })),
    focusCard(2),
  );
  assertEquals(
    handleKeyboardEvent("ArrowLeft", makeState({ focusedIndex: 2 })),
    focusCard(1),
  );
  assertEquals(
    handleKeyboardEvent("ArrowLeft", makeState({ focusedIndex: 1 })),
    focusCard(0),
  );
});

Deno.test("ArrowLeft wraps from first to last occupied slot", () => {
  assertEquals(
    handleKeyboardEvent("ArrowLeft", makeState({ focusedIndex: 0 })),
    focusCard(3),
  );
});

// ─── Arrow navigation — sparse room (gaps) ─────────────────────────────────

Deno.test("ArrowRight skips empty slots in sparse room", () => {
  const state = makeState({ occupiedSlots: [0, 2, 3], focusedIndex: 0 });
  assertEquals(handleKeyboardEvent("ArrowRight", state), focusCard(2));
});

Deno.test("ArrowLeft skips empty slots in sparse room", () => {
  const state = makeState({ occupiedSlots: [0, 2, 3], focusedIndex: 3 });
  assertEquals(handleKeyboardEvent("ArrowLeft", state), focusCard(2));
});

Deno.test("ArrowRight wraps in sparse room", () => {
  const state = makeState({ occupiedSlots: [0, 2, 3], focusedIndex: 3 });
  assertEquals(handleKeyboardEvent("ArrowRight", state), focusCard(0));
});

Deno.test("ArrowLeft wraps in sparse room to last slot", () => {
  const state = makeState({ occupiedSlots: [0, 2, 3], focusedIndex: 0 });
  assertEquals(handleKeyboardEvent("ArrowLeft", state), focusCard(3));
});

Deno.test("ArrowRight with no focus in sparse room focuses first slot", () => {
  const state = makeState({ occupiedSlots: [1, 3] });
  assertEquals(handleKeyboardEvent("ArrowRight", state), focusCard(1));
});

Deno.test("ArrowLeft with no focus in sparse room focuses last slot", () => {
  const state = makeState({ occupiedSlots: [1, 3] });
  assertEquals(handleKeyboardEvent("ArrowLeft", state), focusCard(3));
});

// ─── Arrow navigation — single card ────────────────────────────────────────

Deno.test("ArrowRight on single card stays on same card", () => {
  const state = makeState({ occupiedSlots: [2], focusedIndex: 2 });
  assertEquals(handleKeyboardEvent("ArrowRight", state), focusCard(2));
});

Deno.test("ArrowLeft on single card stays on same card", () => {
  const state = makeState({ occupiedSlots: [2], focusedIndex: 2 });
  assertEquals(handleKeyboardEvent("ArrowLeft", state), focusCard(2));
});

// ─── Arrow navigation — empty room ─────────────────────────────────────────

Deno.test("ArrowRight with empty room returns none", () => {
  assertEquals(
    handleKeyboardEvent("ArrowRight", makeState({ occupiedSlots: [] })),
    { type: "none" },
  );
});

Deno.test("ArrowLeft with empty room returns none", () => {
  assertEquals(
    handleKeyboardEvent("ArrowLeft", makeState({ occupiedSlots: [] })),
    { type: "none" },
  );
});

// ─── Arrow navigation — focus not in occupied slots ────────────────────────

Deno.test("ArrowRight with stale focus (not in slots) starts from first", () => {
  // focusedIndex 1 was removed from room, treat as no focus
  const state = makeState({ occupiedSlots: [0, 2, 3], focusedIndex: 1 });
  assertEquals(handleKeyboardEvent("ArrowRight", state), focusCard(0));
});

Deno.test("ArrowLeft with stale focus (not in slots) starts from last", () => {
  const state = makeState({ occupiedSlots: [0, 2, 3], focusedIndex: 1 });
  assertEquals(handleKeyboardEvent("ArrowLeft", state), focusCard(3));
});

// ─── Enter ──────────────────────────────────────────────────────────────────

Deno.test("Enter with focused card returns select_focused", () => {
  assertEquals(
    handleKeyboardEvent("Enter", makeState({ focusedIndex: 2 })),
    { type: "select_focused" },
  );
});

Deno.test("Enter with no focus returns none", () => {
  assertEquals(handleKeyboardEvent("Enter", makeState()), { type: "none" });
});

Deno.test("Enter when focused card is already selected returns none", () => {
  assertEquals(
    handleKeyboardEvent(
      "Enter",
      makeState({ focusedIndex: 2, selectedIndex: 2 }),
    ),
    { type: "none" },
  );
});

// ─── Escape ─────────────────────────────────────────────────────────────────

Deno.test("Escape with selected card returns deselect", () => {
  assertEquals(
    handleKeyboardEvent("Escape", makeState({ selectedIndex: 1 })),
    { type: "deselect" },
  );
});

Deno.test("Escape with focused (but not selected) card returns deselect", () => {
  assertEquals(
    handleKeyboardEvent("Escape", makeState({ focusedIndex: 1 })),
    { type: "deselect" },
  );
});

Deno.test("Escape with neither focus nor selection returns none", () => {
  assertEquals(handleKeyboardEvent("Escape", makeState()), { type: "none" });
});

Deno.test("Escape with both focused and selected returns deselect", () => {
  assertEquals(
    handleKeyboardEvent(
      "Escape",
      makeState({ focusedIndex: 1, selectedIndex: 2 }),
    ),
    { type: "deselect" },
  );
});

// ─── Action keys — enabled ──────────────────────────────────────────────────

Deno.test("w triggers fightWithWeapon when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: true,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("w", state),
    { type: "action", action: "fightWithWeapon" },
  );
});

Deno.test("W (uppercase) triggers fightWithWeapon when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: true,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("W", state),
    { type: "action", action: "fightWithWeapon" },
  );
});

Deno.test("b triggers fightBarehanded when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: true,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("b", state),
    { type: "action", action: "fightBarehanded" },
  );
});

Deno.test("B (uppercase) triggers fightBarehanded when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: true,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("B", state),
    { type: "action", action: "fightBarehanded" },
  );
});

Deno.test("a triggers avoidRoom when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: true,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("a", state),
    { type: "action", action: "avoidRoom" },
  );
});

Deno.test("A (uppercase) triggers avoidRoom when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: true,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("A", state),
    { type: "action", action: "avoidRoom" },
  );
});

Deno.test("d triggers drinkPotion when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: true,
      fightBarehanded: false,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("d", state),
    { type: "action", action: "drinkPotion" },
  );
});

Deno.test("D (uppercase) triggers drinkPotion when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: true,
      fightBarehanded: false,
      equipWeapon: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("D", state),
    { type: "action", action: "drinkPotion" },
  );
});

Deno.test("e triggers equipWeapon when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: true,
    },
  });
  assertEquals(
    handleKeyboardEvent("e", state),
    { type: "action", action: "equipWeapon" },
  );
});

Deno.test("E (uppercase) triggers equipWeapon when enabled", () => {
  const state = makeState({
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: true,
    },
  });
  assertEquals(
    handleKeyboardEvent("E", state),
    { type: "action", action: "equipWeapon" },
  );
});

// ─── Action keys — disabled ─────────────────────────────────────────────────

Deno.test("w returns none when fightWithWeapon is disabled", () => {
  assertEquals(handleKeyboardEvent("w", makeState()), { type: "none" });
});

Deno.test("b returns none when fightBarehanded is disabled", () => {
  assertEquals(handleKeyboardEvent("b", makeState()), { type: "none" });
});

Deno.test("a returns none when avoidRoom is disabled", () => {
  assertEquals(handleKeyboardEvent("a", makeState()), { type: "none" });
});

Deno.test("d returns none when drinkPotion is disabled", () => {
  assertEquals(handleKeyboardEvent("d", makeState()), { type: "none" });
});

Deno.test("e returns none when equipWeapon is disabled", () => {
  assertEquals(handleKeyboardEvent("e", makeState()), { type: "none" });
});

// ─── Draw card (D key, non-interactive phase) ────────────────────────────────

Deno.test("d triggers drawCard when enabled in non-interactive state", () => {
  const state = makeState({
    isInteractive: false,
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: false,
      drawCard: true,
    },
  });
  assertEquals(
    handleKeyboardEvent("d", state),
    { type: "action", action: "drawCard" },
  );
});

Deno.test("D (uppercase) triggers drawCard when enabled in non-interactive state", () => {
  const state = makeState({
    isInteractive: false,
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: false,
      fightBarehanded: false,
      equipWeapon: false,
      drawCard: true,
    },
  });
  assertEquals(
    handleKeyboardEvent("D", state),
    { type: "action", action: "drawCard" },
  );
});

Deno.test("d returns none when drawCard disabled and not interactive", () => {
  assertEquals(
    handleKeyboardEvent("d", makeState({ isInteractive: false })),
    { type: "none" },
  );
});

Deno.test("d triggers drinkPotion (not drawCard) when interactive", () => {
  const state = makeState({
    isInteractive: true,
    actions: {
      fightWithWeapon: false,
      avoidRoom: false,
      drinkPotion: true,
      fightBarehanded: false,
      equipWeapon: false,
      drawCard: false,
    },
  });
  assertEquals(
    handleKeyboardEvent("d", state),
    { type: "action", action: "drinkPotion" },
  );
});

// ─── UI panel keys (bypass isInteractive) ────────────────────────────────────

Deno.test("h triggers openRules when enabled (interactive)", () => {
  assertEquals(
    handleKeyboardEvent("h", makeState({ actions: { openRules: true } })),
    { type: "action", action: "openRules" },
  );
});

Deno.test("H (uppercase) triggers openRules when enabled", () => {
  assertEquals(
    handleKeyboardEvent("H", makeState({ actions: { openRules: true } })),
    { type: "action", action: "openRules" },
  );
});

Deno.test("h triggers openRules when enabled in non-interactive state", () => {
  assertEquals(
    handleKeyboardEvent(
      "h",
      makeState({ isInteractive: false, actions: { openRules: true } }),
    ),
    { type: "action", action: "openRules" },
  );
});

Deno.test("h returns none when openRules disabled", () => {
  assertEquals(handleKeyboardEvent("h", makeState()), { type: "none" });
});

Deno.test("c triggers copyLink when enabled", () => {
  assertEquals(
    handleKeyboardEvent("c", makeState({ actions: { copyLink: true } })),
    { type: "action", action: "copyLink" },
  );
});

Deno.test("C (uppercase) triggers copyLink when enabled", () => {
  assertEquals(
    handleKeyboardEvent("C", makeState({ actions: { copyLink: true } })),
    { type: "action", action: "copyLink" },
  );
});

Deno.test("c triggers copyLink in non-interactive state", () => {
  assertEquals(
    handleKeyboardEvent(
      "c",
      makeState({ isInteractive: false, actions: { copyLink: true } }),
    ),
    { type: "action", action: "copyLink" },
  );
});

Deno.test("c returns none when copyLink disabled", () => {
  assertEquals(handleKeyboardEvent("c", makeState()), { type: "none" });
});

Deno.test("l triggers openLeaderboard when enabled", () => {
  assertEquals(
    handleKeyboardEvent(
      "l",
      makeState({ actions: { openLeaderboard: true } }),
    ),
    { type: "action", action: "openLeaderboard" },
  );
});

Deno.test("L (uppercase) triggers openLeaderboard when enabled", () => {
  assertEquals(
    handleKeyboardEvent(
      "L",
      makeState({ actions: { openLeaderboard: true } }),
    ),
    { type: "action", action: "openLeaderboard" },
  );
});

Deno.test("l triggers openLeaderboard in non-interactive state", () => {
  assertEquals(
    handleKeyboardEvent(
      "l",
      makeState({ isInteractive: false, actions: { openLeaderboard: true } }),
    ),
    { type: "action", action: "openLeaderboard" },
  );
});

Deno.test("l returns none when openLeaderboard disabled", () => {
  assertEquals(handleKeyboardEvent("l", makeState()), { type: "none" });
});
