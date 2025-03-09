export type Suit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface Monster extends Card {
  type: 'MONSTER';
  damage: number;
}

export interface Weapon extends Card {
  type: 'WEAPON';
  damage: number;
  monstersSlain: Monster[];
}

export interface HealthPotion extends Card {
  type: 'HEALTH_POTION';
  healing: number;
}

export type GameCard = Monster | Weapon | HealthPotion; 