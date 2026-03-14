import type { Card, EquippedWeapon, GamePhase } from "@scoundrel/engine";

export type GameView = {
  gameId: string;
  playerName: string;
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

export type LeaderboardEntry = {
  gameId: string;
  playerName: string;
  score: number;
  completedAt: string; // ISO 8601 UTC
};

export type LeaderboardRank = {
  entry: LeaderboardEntry;
  rank: number;
  totalEntries: number;
};
