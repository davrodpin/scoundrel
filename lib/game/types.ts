import type { Card, EquippedWeapon, GamePhase } from "@scoundrel/engine";

export type GameView = {
  gameId: string;
  health: number;
  dungeonCount: number;
  room: readonly Card[];
  discardCount: number;
  equippedWeapon: EquippedWeapon | null;
  phase: GamePhase;
  lastRoomAvoided: boolean;
  turnNumber: number;
  lastCardPlayed: Card | null;
  score: number | null;
};
