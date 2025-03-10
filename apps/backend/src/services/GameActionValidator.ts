import { GameState, GameAction } from '../types/game';
import { Monster, GameCard, Weapon, HealthPotion } from '../types/cards';

const isDevelopment = process.env.NODE_ENV !== 'production';

function isSameCard(card1: GameCard, card2: GameCard): boolean {
  return card1.suit === card2.suit && card1.rank === card2.rank;
}

function findCardInRoom(state: GameState, card: GameCard): GameCard | undefined {
  return state.room.find(c => isSameCard(c, card));
}

export class GameActionValidator {
  validateAction(state: GameState, action: GameAction): string | null {
    if (isDevelopment) {
      console.log('[DEBUG] Validating game action:', {
        actionType: action.type,
        gameOver: state.gameOver,
        currentState: {
          health: state.health,
          maxHealth: state.maxHealth,
          roomCards: state.room.map(card => ({
            type: card.type,
            suit: card.suit,
            rank: card.rank
          }))
        }
      });
    }

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
    if (isDevelopment) {
      console.log('[DEBUG] Validating draw room:', {
        roomSize: state.room.length,
        dungeonSize: state.dungeon.length,
        requiredCards: state.room.length === 1 ? 3 : 4
      });
    }

    if (state.room.length > 1) {
      return 'Cannot draw room when current room has more than one card';
    }
    if (state.dungeon.length < (state.room.length === 1 ? 3 : 4)) {
      return 'Not enough cards in dungeon to draw a room';
    }
    return null;
  }

  private validateAvoidRoom(state: GameState): string | null {
    if (isDevelopment) {
      console.log('[DEBUG] Validating avoid room:', {
        canAvoidRoom: state.canAvoidRoom,
        lastActionWasAvoid: state.lastActionWasAvoid,
        roomSize: state.room.length
      });
    }

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
    if (isDevelopment) {
      console.log('[DEBUG] Validating fight monster:', {
        monsterDetails: {
          type: monster.type,
          suit: monster.suit,
          rank: monster.rank,
          damage: monster.damage
        },
        roomCards: state.room.map(card => ({
          type: card.type,
          suit: card.suit,
          rank: card.rank
        }))
      });
    }

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
    if (isDevelopment) {
      console.log('[DEBUG] Validating use weapon:', {
        monsterDetails: {
          type: monster.type,
          suit: monster.suit,
          rank: monster.rank,
          damage: monster.damage
        },
        equippedWeapon: state.equippedWeapon ? {
          type: state.equippedWeapon.type,
          suit: state.equippedWeapon.suit,
          rank: state.equippedWeapon.rank,
          damage: state.equippedWeapon.damage
        } : null
      });
    }

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
    if (isDevelopment) {
      console.log('[DEBUG] Validating use health potion:', {
        healing,
        currentHealth: state.health,
        maxHealth: state.maxHealth,
        roomCards: state.room.map(card => ({
          type: card.type,
          suit: card.suit,
          rank: card.rank,
          ...(card.type === 'HEALTH_POTION' ? { healing: (card as HealthPotion).healing } : {})
        }))
      });
    }

    const potion = state.room.find(
      card => card.type === 'HEALTH_POTION' && (card as HealthPotion).healing === healing
    );

    if (!potion) {
      if (isDevelopment) {
        console.log('[DEBUG] Health potion validation failed: potion not found in room');
      }
      return 'Health potion not found in current room';
    }

    if (isDevelopment) {
      console.log('[DEBUG] Health potion validation passed');
    }
    return null;
  }

  private validateEquipWeapon(state: GameState, weapon: Weapon): string | null {
    if (isDevelopment) {
      console.log('[DEBUG] Validating equip weapon:', {
        weaponDetails: {
          type: weapon.type,
          suit: weapon.suit,
          rank: weapon.rank,
          damage: weapon.damage
        },
        roomCards: state.room.map(card => ({
          type: card.type,
          suit: card.suit,
          rank: card.rank
        }))
      });
    }

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