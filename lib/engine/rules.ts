import type { GameState } from "./types.ts";
import type { GameAction } from "./actions.ts";
import { getCardType } from "./deck.ts";

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

function validateDrawCard(state: GameState): ValidationResult {
  if (state.phase.kind !== "drawing") {
    return { valid: false, reason: "Cannot draw card: phase is not drawing" };
  }
  return { valid: true };
}

function validateAvoidRoom(state: GameState): ValidationResult {
  if (state.phase.kind !== "room_ready") {
    return {
      valid: false,
      reason: "Cannot avoid room: phase is not room_ready",
    };
  }
  if (state.lastRoomAvoided) {
    return {
      valid: false,
      reason: "Cannot avoid room: cannot avoid two rooms in a row",
    };
  }
  return { valid: true };
}

function validateEnterRoom(state: GameState): ValidationResult {
  if (state.phase.kind !== "room_ready") {
    return {
      valid: false,
      reason: "Cannot enter room: phase is not room_ready",
    };
  }
  return { valid: true };
}

function validateChooseCard(
  state: GameState,
  cardIndex: number,
  fightWith: "weapon" | "barehanded",
): ValidationResult {
  if (state.phase.kind !== "choosing") {
    return {
      valid: false,
      reason: "Cannot choose card: phase is not choosing",
    };
  }

  if (cardIndex < 0 || cardIndex >= state.room.length) {
    return {
      valid: false,
      reason: "Cannot choose card: cardIndex out of bounds",
    };
  }

  const card = state.room[cardIndex];
  const cardType = getCardType(card);

  if (cardType === "monster" && fightWith === "weapon") {
    if (state.equippedWeapon === null) {
      return {
        valid: false,
        reason: "Cannot fight with weapon: no weapon equipped",
      };
    }

    const { slainMonsters } = state.equippedWeapon;
    if (slainMonsters.length > 0) {
      const lastSlain = slainMonsters[slainMonsters.length - 1];
      if (card.rank > lastSlain.rank) {
        return {
          valid: false,
          reason:
            "Cannot fight with weapon: monster rank exceeds last slain monster rank",
        };
      }
    }
  }

  return { valid: true };
}

export function validateAction(
  state: GameState,
  action: GameAction,
): ValidationResult {
  switch (action.type) {
    case "draw_card":
      return validateDrawCard(state);
    case "avoid_room":
      return validateAvoidRoom(state);
    case "enter_room":
      return validateEnterRoom(state);
    case "choose_card":
      return validateChooseCard(state, action.cardIndex, action.fightWith);
  }
}
