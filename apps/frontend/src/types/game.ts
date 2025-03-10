import { GameCard, Monster, Weapon } from './cards';

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
  lastActionTimestamp: number;
  lastActionSequence: number;
  stateChecksum: string;
}

interface BaseGameAction {
  timestamp: number;
  sequence: number;
}

type DrawRoomAction = BaseGameAction & { type: 'DRAW_ROOM' };
type AvoidRoomAction = BaseGameAction & { type: 'AVOID_ROOM' };
type FightMonsterAction = BaseGameAction & { type: 'FIGHT_MONSTER'; monster: Monster };
type UseWeaponAction = BaseGameAction & { type: 'USE_WEAPON'; monster: Monster };
type UseHealthPotionAction = BaseGameAction & { type: 'USE_HEALTH_POTION'; healing: number };
type EquipWeaponAction = BaseGameAction & { type: 'EQUIP_WEAPON'; weapon: Weapon };

export type GameAction =
  | DrawRoomAction
  | AvoidRoomAction
  | FightMonsterAction
  | UseWeaponAction
  | UseHealthPotionAction
  | EquipWeaponAction;

export type GameActionWithoutSecurity =
  | { type: 'DRAW_ROOM' }
  | { type: 'AVOID_ROOM' }
  | { type: 'FIGHT_MONSTER'; monster: Monster }
  | { type: 'USE_WEAPON'; monster: Monster }
  | { type: 'USE_HEALTH_POTION'; healing: number }
  | { type: 'EQUIP_WEAPON'; weapon: Weapon }; 