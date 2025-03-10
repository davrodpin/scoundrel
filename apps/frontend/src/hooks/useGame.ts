import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import type { GameState, GameAction, GameSession } from '../types/game';
import type { Monster, Weapon, HealthPotion, GameCard } from '../types/cards';
import { gameReducer } from '../reducers/gameReducer';

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

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timestamp: string;
}

export function useGame() {
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    console.log('Initializing Socket.IO connection...');
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    console.log('Connecting to backend at:', backendUrl);
    
    const newSocket = io(backendUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server with ID:', newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (err: Error) => {
      console.error('Socket.IO connection error:', err);
      setIsConnected(false);
      setError(`Failed to connect to game server: ${err.message}`);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
    });

    newSocket.on('leaderboard_updated', (entries: LeaderboardEntry[]) => {
      setLeaderboardEntries(entries);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up Socket.IO connection...');
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_created', (session: GameSession) => {
      console.log('Game created with session:', session);
      setSessionId(session.id);
      setState(session.state);
    });

    socket.on('game_state_updated', (newState: GameState) => {
      console.log('Game state updated:', newState);
      setState(newState);
    });

    socket.on('error', (err: { message: string }) => {
      console.error('Game error:', err.message);
      setError(err.message);
    });

    return () => {
      socket.off('game_created');
      socket.off('game_state_updated');
      socket.off('error');
    };
  }, [socket]);

  const createGame = useCallback(() => {
    if (!isConnected || !socket) {
      console.error('Cannot create game: socket is not connected');
      return;
    }
    console.log('Creating new game...');
    socket.emit('create_game');
  }, [socket, isConnected]);

  const dispatchAction = useCallback((action: GameAction) => {
    if (!isConnected || !socket || !sessionId) {
      console.error('Cannot dispatch action: socket is not connected or sessionId is missing');
      return;
    }
    console.log('Dispatching action:', action);
    socket.emit('game_action', { sessionId, action });
  }, [socket, sessionId, isConnected]);

  const fetchLeaderboard = useCallback(() => {
    if (!isConnected || !socket) {
      console.error('Cannot fetch leaderboard: socket is not connected');
      return;
    }
    socket.emit('fetch_leaderboard');
  }, [socket, isConnected]);

  const submitScore = useCallback((data: { playerName: string; score: number }) => {
    if (!isConnected || !socket) {
      console.error('Cannot submit score: socket is not connected');
      return;
    }
    socket.emit('submit_score', data);
  }, [socket, isConnected]);

  return {
    state,
    error,
    isConnected,
    leaderboardEntries,
    actions: {
      createGame,
      drawRoom: () => dispatchAction({ type: 'DRAW_ROOM' }),
      avoidRoom: () => dispatchAction({ type: 'AVOID_ROOM' }),
      fightMonster: (monster: Monster) => dispatchAction({ type: 'FIGHT_MONSTER', monster }),
      useWeapon: (monster: Monster) => dispatchAction({ type: 'USE_WEAPON', monster }),
      useHealthPotion: (potion: HealthPotion) => 
        dispatchAction({ type: 'USE_HEALTH_POTION', healing: potion.healing }),
      equipWeapon: (weapon: Weapon) => dispatchAction({ type: 'EQUIP_WEAPON', weapon }),
      fetchLeaderboard,
      submitScore
    }
  };
} 