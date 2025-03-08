export type Suit = 'CLUBS' | 'SPADES' | 'HEARTS' | 'DIAMONDS';
export type Rank = 'ACE' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'JACK' | 'QUEEN' | 'KING';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export type CardType = 'MONSTER' | 'WEAPON' | 'HEALTH_POTION';

export interface GameCard extends Card {
  type: CardType;
}

export interface Monster extends GameCard {
  type: 'MONSTER';
  damage: number;
}

export interface Weapon extends GameCard {
  type: 'WEAPON';
  damage: number;
  monstersSlain: Monster[];
}

export interface HealthPotion extends GameCard {
  type: 'HEALTH_POTION';
  healing: number;
} 