// Core card types
export type Suit = "clubs" | "spades" | "diamonds" | "hearts";
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type CardType = "monster" | "weapon" | "potion";

export type Card = {
  suit: Suit;
  rank: Rank;
};

// Weapon tracking
export type EquippedWeapon = {
  card: Card;
  slainMonsters: readonly Card[];
};

// Game phases
export type ChoosingPhase = {
  kind: "choosing";
  cardsChosen: number;
  potionUsedThisTurn: boolean;
};

export type GameOverPhase = {
  kind: "game_over";
  reason: "dead" | "dungeon_cleared";
};

export type GamePhase =
  | { kind: "drawing" }
  | { kind: "room_ready" }
  | ChoosingPhase
  | GameOverPhase;

// Full game state
export type GameState = {
  gameId: string;
  health: number;
  dungeon: readonly Card[];
  room: readonly Card[];
  discard: readonly Card[];
  equippedWeapon: EquippedWeapon | null;
  phase: GamePhase;
  lastRoomAvoided: boolean;
  turnNumber: number;
  lastCardPlayed: Card | null;
};
