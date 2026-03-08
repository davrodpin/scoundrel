import type { GameState } from "./types.ts";
import { cardValue, getCardType } from "./deck.ts";

/**
 * Calculates the score for a game based on its current state.
 *
 * - Dead: health minus all remaining monster values (dungeon + room)
 * - Survived: remaining health (with bonus if health=20 and last card was a potion)
 * - In-progress: current health as interim score
 */
export function calculateScore(state: GameState): number {
  if (state.phase.kind !== "game_over") {
    return state.health;
  }

  if (state.phase.reason === "dead") {
    const remainingCards = [...state.dungeon, ...state.room];
    const monsterTotal = remainingCards
      .filter((card) => getCardType(card) === "monster")
      .reduce((sum, card) => sum + cardValue(card), 0);
    return state.health - monsterTotal;
  }

  // dungeon_cleared
  if (
    state.health === 20 &&
    state.lastCardPlayed !== null &&
    getCardType(state.lastCardPlayed) === "potion"
  ) {
    return 20 + cardValue(state.lastCardPlayed);
  }

  return state.health;
}
