import type { Monster, Weapon, GameCard } from './cards';

export interface GameSession {
  id: string;
  playerId: string;
  state: GameState;
  createdAt: Date;
  lastUpdatedAt: Date;
  actionCount: number;
  lastActionTime: number;
  actionsInLastMinute: number;
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
  lastActionTimestamp: number;
  lastActionSequence: number;
  stateChecksum: string;
}

export interface GameAction {
  type: 'DRAW_ROOM' | 'AVOID_ROOM' | 'FIGHT_MONSTER' | 'USE_WEAPON' | 'USE_HEALTH_POTION' | 'EQUIP_WEAPON';
  monster?: Monster;
  weapon?: Weapon;
  healing?: number;
  timestamp: number;
  sequence: number;
} 