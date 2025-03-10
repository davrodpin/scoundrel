import { GameState, GameAction } from '../types/game';
import { Monster, GameCard, Weapon, HealthPotion } from '../types/cards';

function isSameCard(card1: GameCard, card2: GameCard): boolean {
  return card1.suit === card2.suit && card1.rank === card2.rank;
}

function findCardInRoom(state: GameState, card: GameCard): GameCard | undefined {
  return state.room.find(c => isSameCard(c, card));
}

export class GameActionValidator {
  validateAction(state: GameState, action: GameAction): string | null {
    if (state.gameOver) {
      return 'Game is already over';
    }

    switch (action.type) {
      case 'DRAW_ROOM':
        return this.validateDrawRoom(state);
      
      case 'AVOID_ROOM':
        return this.validateAvoidRoom(state);
      
      case 'FIGHT_MONSTER':
        if (!action.monster) {
          return 'Monster is required for FIGHT_MONSTER action';
        }
        return this.validateFightMonster(state, action.monster);
      
      case 'USE_WEAPON':
        if (!action.monster) {
          return 'Monster is required for USE_WEAPON action';
        }
        return this.validateUseWeapon(state, action.monster);
      
      case 'USE_HEALTH_POTION':
        if (typeof action.healing !== 'number') {
          return 'Healing amount is required for USE_HEALTH_POTION action';
        }
        return this.validateUseHealthPotion(state, action.healing);
      
      case 'EQUIP_WEAPON':
        if (!action.weapon) {
          return 'Weapon is required for EQUIP_WEAPON action';
        }
        return this.validateEquipWeapon(state, action.weapon);
      
      default:
        return 'Invalid action type';
    }
  }

  private validateDrawRoom(state: GameState): string | null {
    if (state.room.length > 1) {
      return 'Cannot draw room when current room has more than one card';
    }
    if (state.dungeon.length < (state.room.length === 1 ? 3 : 4)) {
      return 'Not enough cards in dungeon to draw a room';
    }
    return null;
  }

  private validateAvoidRoom(state: GameState): string | null {
    if (!state.canAvoidRoom) {
      return 'Cannot avoid room at this time';
    }
    if (state.lastActionWasAvoid) {
      return 'Cannot avoid room twice in a row';
    }
    if (state.room.length === 0) {
      return 'No room to avoid';
    }
    return null;
  }

  private validateFightMonster(state: GameState, monster: Monster): string | null {
    const roomMonster = findCardInRoom(state, monster);
    if (!roomMonster || roomMonster.type !== 'MONSTER') {
      return 'Monster not found in current room';
    }
    if (!isSameCard(roomMonster, monster)) {
      return 'Monster data does not match room data';
    }
    return null;
  }

  private validateUseWeapon(state: GameState, monster: Monster): string | null {
    if (!state.equippedWeapon) {
      return 'No weapon equipped';
    }
    const roomMonster = findCardInRoom(state, monster);
    if (!roomMonster || roomMonster.type !== 'MONSTER') {
      return 'Monster not found in current room';
    }
    if (!isSameCard(roomMonster, monster)) {
      return 'Monster data does not match room data';
    }
    if (state.equippedWeapon.damage < monster.damage) {
      return 'Weapon is too weak for this monster';
    }
    return null;
  }

  private validateUseHealthPotion(state: GameState, healing: number): string | null {
    const potion = state.room.find(
      card => card.type === 'HEALTH_POTION' && (card as HealthPotion).healing === healing
    );
    if (!potion) {
      return 'Health potion not found in current room';
    }
    if (state.health >= state.maxHealth) {
      return 'Health is already at maximum';
    }
    return null;
  }

  private validateEquipWeapon(state: GameState, weapon: Weapon): string | null {
    const roomWeapon = findCardInRoom(state, weapon);
    if (!roomWeapon || roomWeapon.type !== 'WEAPON') {
      return 'Weapon not found in current room';
    }
    if (!isSameCard(roomWeapon, weapon)) {
      return 'Weapon data does not match room data';
    }
    return null;
  }
}

export const gameActionValidator = new GameActionValidator(); 