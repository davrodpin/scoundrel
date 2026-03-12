export type ActionKey =
  | "fightWithWeapon"
  | "avoidRoom"
  | "drinkPotion"
  | "fightBarehanded"
  | "equipWeapon"
  | "drawCard"
  | "openRules"
  | "copyLink"
  | "openLeaderboard";

export type KeyboardIntent =
  | { type: "focus_card"; index: number }
  | { type: "select_focused" }
  | { type: "deselect" }
  | { type: "action"; action: ActionKey }
  | { type: "none" };

export type KeyboardState = {
  focusedIndex: number | null;
  selectedIndex: number | null;
  occupiedSlots: number[];
  isInteractive: boolean;
  actions: Record<ActionKey, boolean>;
};

const NONE: KeyboardIntent = { type: "none" };

function navigateSlots(
  slots: number[],
  currentFocus: number | null,
  direction: "right" | "left",
): KeyboardIntent {
  if (slots.length === 0) return NONE;

  const currentIdx = currentFocus !== null ? slots.indexOf(currentFocus) : -1;

  let nextIdx: number;
  if (currentIdx === -1) {
    nextIdx = direction === "right" ? 0 : slots.length - 1;
  } else if (direction === "right") {
    nextIdx = (currentIdx + 1) % slots.length;
  } else {
    nextIdx = (currentIdx - 1 + slots.length) % slots.length;
  }

  return { type: "focus_card", index: slots[nextIdx] };
}

export function handleKeyboardEvent(
  key: string,
  state: KeyboardState,
): KeyboardIntent {
  const lowerKey = key.toLowerCase();

  // Draw card works outside card-interactive mode (drawing phase)
  if (lowerKey === "d" && state.actions.drawCard) {
    return { type: "action", action: "drawCard" };
  }

  // UI panel actions work in any game phase
  if (key === "?" && state.actions.openRules) {
    return { type: "action", action: "openRules" };
  }
  if (lowerKey === "c" && state.actions.copyLink) {
    return { type: "action", action: "copyLink" };
  }
  if (lowerKey === "l" && state.actions.openLeaderboard) {
    return { type: "action", action: "openLeaderboard" };
  }

  if (!state.isInteractive) return NONE;

  switch (lowerKey) {
    case "arrowright":
      return navigateSlots(state.occupiedSlots, state.focusedIndex, "right");

    case "arrowleft":
      return navigateSlots(state.occupiedSlots, state.focusedIndex, "left");

    case "enter":
      if (
        state.focusedIndex !== null &&
        state.focusedIndex !== state.selectedIndex
      ) {
        return { type: "select_focused" };
      }
      return NONE;

    case "escape":
      if (state.selectedIndex !== null || state.focusedIndex !== null) {
        return { type: "deselect" };
      }
      return NONE;

    case "w":
      return state.actions.fightWithWeapon
        ? { type: "action", action: "fightWithWeapon" }
        : NONE;

    case "b":
      return state.actions.fightBarehanded
        ? { type: "action", action: "fightBarehanded" }
        : NONE;

    case "a":
      return state.actions.avoidRoom
        ? { type: "action", action: "avoidRoom" }
        : NONE;

    case "p":
      return state.actions.drinkPotion
        ? { type: "action", action: "drinkPotion" }
        : NONE;

    case "e":
      return state.actions.equipWeapon
        ? { type: "action", action: "equipWeapon" }
        : NONE;

    default:
      return NONE;
  }
}
