export type Suit = '♠' | '♣' | '♥' | '♦';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export interface BaseCard {
  suit: Suit;
  rank: Rank;
}

export interface Monster extends BaseCard {
  type: 'MONSTER';
  damage: number;
}

export interface Weapon extends BaseCard {
  type: 'WEAPON';
  damage: number;
  monstersSlain: Monster[];
}

export interface HealthPotion extends BaseCard {
  type: 'HEALTH_POTION';
  healing: number;
}

export type GameCard = Monster | Weapon | HealthPotion; 