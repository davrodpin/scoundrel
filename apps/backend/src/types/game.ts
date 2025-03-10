import { GameCard, Monster, Weapon } from './cards.js';

export interface GameSession {
  id: string;
  state: GameState;
  playerId: string;
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface GameState {
  health: number;
  maxHealth: number;
  dungeon: GameCard[];
  room: GameCard[];
  discardPile: GameCard[];
  equippedWeapon: Weapon | null;
  canAvoidRoom: boolean;
  gameOver: boolean;
  score: number;
  originalRoomSize: number;
  remainingAvoids: number;
  lastActionWasAvoid: boolean;
}

export type GameAction = 
  | { type: 'DRAW_ROOM' }
  | { type: 'AVOID_ROOM' }
  | { type: 'SELECT_CARD'; cardIndex: number }
  | { type: 'FIGHT_MONSTER'; monster: Monster }
  | { type: 'USE_WEAPON'; monster: Monster }
  | { type: 'USE_HEALTH_POTION'; healing: number }
  | { type: 'EQUIP_WEAPON'; weapon: Weapon }; 