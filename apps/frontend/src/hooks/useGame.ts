import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import type { GameState, GameAction, GameSession, GameActionWithoutSecurity } from '../types/game';
import type { Monster, Weapon, HealthPotion } from '../types/cards';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timestamp: string;
}

// Debug logging utility that only logs in development
const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  }
};

export function useGame() {
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 12; // 1 minute with 5-second intervals

  useEffect(() => {
    debug.log('Initializing Socket.IO connection...');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://scoundrel-backend.onrender.com';
    debug.log('Backend URL from env:', backendUrl);
    
    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      reconnectionDelay: 5000, // 5 seconds between retries
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxRetries
    });

    debug.log('Socket.IO instance URI:', newSocket.io.uri);
    
    newSocket.on('connect', () => {
      debug.log('Connected to Socket.IO server with ID:', newSocket.id);
      debug.log('Final connection URI:', newSocket.io.uri);
      setRetryCount(0);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (err: Error) => {
      debug.error('Socket.IO connection error:', err);
      setIsConnected(false);
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount <= maxRetries) {
          setError(`Waiting for game server to start... Attempt ${newCount}/${maxRetries}`);
        } else {
          setError('Could not connect to game server. Please try refreshing the page.');
        }
        return newCount;
      });
    });

    newSocket.on('disconnect', (reason: string) => {
      debug.log('Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
      if (reason === 'transport close') {
        setError('Connection to game server lost. Attempting to reconnect...');
      }
    });

    newSocket.on('leaderboard_updated', (entries: LeaderboardEntry[]) => {
      setLeaderboardEntries(entries);
    });

    setSocket(newSocket);

    return () => {
      debug.log('Cleaning up Socket.IO connection...');
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_created', (session: GameSession) => {
      debug.log('Game created with session:', session);
      setSessionId(session.id);
      setState(session.state);
    });

    socket.on('game_state_updated', (newState: GameState) => {
      debug.log('Game state updated:', newState);
      setState(newState);
    });

    socket.on('error', (err: { message: string }) => {
      debug.error('Game error:', err.message);
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
      debug.error('Cannot create game: socket is not connected');
      return;
    }
    debug.log('Creating new game...');
    socket.emit('create_game');
  }, [socket, isConnected]);

  const dispatchAction = useCallback((baseAction: GameActionWithoutSecurity) => {
    if (!isConnected || !socket || !sessionId || !state) {
      debug.error('Cannot dispatch action: socket is not connected, sessionId is missing, or state is null');
      return;
    }

    const action: GameAction = {
      ...baseAction,
      timestamp: Date.now(),
      sequence: (state.lastActionSequence || 0) + 1
    } as GameAction;

    debug.log('Dispatching action:', action);
    socket.emit('game_action', { sessionId, action });
  }, [socket, sessionId, isConnected, state]);

  const fetchLeaderboard = useCallback(() => {
    if (!isConnected || !socket) {
      debug.error('Cannot fetch leaderboard: socket is not connected');
      return;
    }
    socket.emit('fetch_leaderboard');
  }, [socket, isConnected]);

  const submitScore = useCallback((data: { playerName: string; score: number }) => {
    if (!isConnected || !socket) {
      debug.error('Cannot submit score: socket is not connected');
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