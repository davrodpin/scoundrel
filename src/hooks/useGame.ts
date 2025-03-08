import { useReducer } from 'react';
import { GameState, GameAction } from '../types/game';
import { GameCard, Monster, Weapon, HealthPotion } from '../types/cards';

function getRankValue(rank: string): number {
  const rankMap: { [key: string]: number } = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11,
    '10': 10, '9': 9, '8': 8, '7': 7,
    '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return rankMap[rank] || 0;
}

const initialState: GameState = {
  health: 20,
  maxHealth: 20,
  dungeon: [],
  room: [],
  discardPile: [],
  equippedWeapon: null,
  canAvoidRoom: true,
  gameOver: false,
  score: 0,
  originalRoomSize: 0,
  remainingAvoids: 1,
  lastActionWasAvoid: false
};

type ExtendedGameAction = GameAction | { type: 'INITIALIZE_GAME'; deck: GameCard[] };

function gameReducer(state: GameState, action: ExtendedGameAction): GameState {
  if (state.gameOver && action.type !== 'INITIALIZE_GAME') {
    return state;
  }

  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...initialState,
        dungeon: action.deck
      };

    case 'DRAW_ROOM':
      if (state.dungeon.length < 3) {
        const allMonsters = [
          ...state.dungeon.filter(card => card.type === 'MONSTER'),
          ...state.room.filter(card => card.type === 'MONSTER'),
          ...state.discardPile.filter(card => card.type === 'MONSTER')
        ] as Monster[];
        
        const score = state.health > 0 
          ? state.health 
          : -allMonsters.reduce((acc, monster) => acc + getRankValue(monster.rank), 0);
        return { ...state, gameOver: true, score };
      }
      
      // If there's one card in the room, keep it and add three new cards
      if (state.room.length === 1) {
        const newCards = state.dungeon.slice(0, 3);
        const dungeon = state.dungeon.slice(3);
        return { 
          ...state, 
          room: [...state.room, ...newCards], 
          dungeon,
          canAvoidRoom: !state.lastActionWasAvoid,
          originalRoomSize: 4,
          remainingAvoids: 1,
          lastActionWasAvoid: false
        };
      }
      
      // Otherwise, draw a fresh room of 4 cards
      const room = state.dungeon.slice(0, 4);
      const dungeon = state.dungeon.slice(4);
      return { 
        ...state, 
        room, 
        dungeon, 
        canAvoidRoom: !state.lastActionWasAvoid,
        originalRoomSize: 4,
        remainingAvoids: 1,
        lastActionWasAvoid: false
      };

    case 'AVOID_ROOM':
      if (!state.canAvoidRoom || state.lastActionWasAvoid) return state;
      const updatedDungeon = [...state.dungeon, ...state.room];
      return { 
        ...state, 
        room: [], 
        dungeon: updatedDungeon,
        originalRoomSize: 0,
        remainingAvoids: 0,
        lastActionWasAvoid: true
      };

    case 'FIGHT_MONSTER':
      const { monster } = action;
      const newHealth = state.health - monster.damage;
      const updatedRoom = state.room.filter(card => card !== monster);
      const isGameOver = newHealth <= 0;
      
      if (isGameOver) {
        const allMonsters = [
          ...state.dungeon.filter(card => card.type === 'MONSTER'),
          ...updatedRoom.filter(card => card.type === 'MONSTER'),
          ...state.discardPile.filter(card => card.type === 'MONSTER'),
          monster
        ] as Monster[];
        
        const score = -allMonsters.reduce((acc, m) => acc + getRankValue(m.rank), 0);
        return {
          ...state,
          health: newHealth,
          room: updatedRoom,
          discardPile: [...state.discardPile, monster],
          gameOver: true,
          score,
          canAvoidRoom: false,
          remainingAvoids: 0,
          lastActionWasAvoid: false
        };
      }

      return {
        ...state,
        health: newHealth,
        room: updatedRoom,
        discardPile: [...state.discardPile, monster],
        gameOver: false,
        canAvoidRoom: updatedRoom.length === state.originalRoomSize,
        remainingAvoids: 0,
        lastActionWasAvoid: false
      };

    case 'USE_WEAPON':
      if (!state.equippedWeapon) return state;
      const damage = Math.max(0, action.monster.damage - state.equippedWeapon.damage);
      const updatedWeapon = {
        ...state.equippedWeapon,
        monstersSlain: [...state.equippedWeapon.monstersSlain, action.monster]
      };
      const roomAfterWeapon = state.room.filter(card => card !== action.monster);
      const newHealthAfterWeapon = state.health - damage;
      const isGameOverAfterWeapon = newHealthAfterWeapon <= 0;

      if (isGameOverAfterWeapon) {
        const allMonsters = [
          ...state.dungeon.filter(card => card.type === 'MONSTER'),
          ...roomAfterWeapon.filter(card => card.type === 'MONSTER'),
          ...state.discardPile.filter(card => card.type === 'MONSTER'),
          action.monster
        ] as Monster[];
        
        const score = -allMonsters.reduce((acc, m) => acc + getRankValue(m.rank), 0);
        return {
          ...state,
          health: newHealthAfterWeapon,
          equippedWeapon: updatedWeapon,
          room: roomAfterWeapon,
          discardPile: [...state.discardPile, action.monster],
          gameOver: true,
          score,
          canAvoidRoom: false,
          remainingAvoids: 0,
          lastActionWasAvoid: false
        };
      }

      return {
        ...state,
        health: newHealthAfterWeapon,
        equippedWeapon: updatedWeapon,
        room: roomAfterWeapon,
        discardPile: [...state.discardPile, action.monster],
        gameOver: false,
        canAvoidRoom: roomAfterWeapon.length === state.originalRoomSize,
        remainingAvoids: 0,
        lastActionWasAvoid: false
      };

    case 'USE_HEALTH_POTION':
      const potion = state.room.find(card => 
        card.type === 'HEALTH_POTION' && (card as HealthPotion).healing === action.healing
      );
      if (!potion) return state;
      
      const newHealthWithPotion = Math.min(
        state.maxHealth,
        state.health + action.healing
      );
      const roomAfterPotion = state.room.filter(card => card !== potion);
      return {
        ...state,
        health: newHealthWithPotion,
        room: roomAfterPotion,
        discardPile: [...state.discardPile, potion],
        canAvoidRoom: roomAfterPotion.length === state.originalRoomSize,
        remainingAvoids: 0,
        lastActionWasAvoid: false
      };

    case 'EQUIP_WEAPON':
      const oldWeapon = state.equippedWeapon;
      const roomAfterEquip = state.room.filter(card => card !== action.weapon);
      if (oldWeapon) {
        return {
          ...state,
          equippedWeapon: action.weapon,
          discardPile: [...state.discardPile, oldWeapon],
          room: roomAfterEquip,
          canAvoidRoom: roomAfterEquip.length === state.originalRoomSize,
          remainingAvoids: 0,
          lastActionWasAvoid: false
        };
      }
      return {
        ...state,
        equippedWeapon: action.weapon,
        room: roomAfterEquip,
        canAvoidRoom: roomAfterEquip.length === state.originalRoomSize,
        remainingAvoids: 0,
        lastActionWasAvoid: false
      };

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const initializeGame = (deck: GameCard[]) => dispatch({ type: 'INITIALIZE_GAME', deck });
  const drawRoom = () => dispatch({ type: 'DRAW_ROOM' });
  const avoidRoom = () => dispatch({ type: 'AVOID_ROOM' });
  const fightMonster = (monster: Monster) => dispatch({ type: 'FIGHT_MONSTER', monster });
  const useWeapon = (monster: Monster) => dispatch({ type: 'USE_WEAPON', monster });
  const useHealthPotion = (potion: HealthPotion) => 
    dispatch({ type: 'USE_HEALTH_POTION', healing: potion.healing });
  const equipWeapon = (weapon: Weapon) => dispatch({ type: 'EQUIP_WEAPON', weapon });

  return {
    state,
    actions: {
      initializeGame,
      drawRoom,
      avoidRoom,
      fightMonster,
      useWeapon,
      useHealthPotion,
      equipWeapon
    }
  };
} 