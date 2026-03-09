import type { GameState } from "@scoundrel/engine";
import { calculateScore } from "@scoundrel/engine";
import type { GameView } from "./types.ts";

export function toGameView(state: GameState, playerName: string): GameView {
  const isGameOver = state.phase.kind === "game_over";

  return {
    gameId: state.gameId,
    playerName,
    health: state.health,
    dungeonCount: state.dungeon.length,
    room: state.room,
    discardCount: state.discard.length,
    equippedWeapon: state.equippedWeapon,
    phase: state.phase,
    lastRoomAvoided: state.lastRoomAvoided,
    turnNumber: state.turnNumber,
    lastCardPlayed: state.lastCardPlayed,
    score: isGameOver ? calculateScore(state) : null,
  };
}
