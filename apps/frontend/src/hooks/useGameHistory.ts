import { useState, useCallback } from 'react';
import { socket } from '../socket';
import type { GameState, GameAction } from '../types/game';

interface GameHistoryEntry {
  state: GameState;
  action: GameAction;
  timestamp: Date;
}

export function useGameHistory(sessionId: string | undefined) {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    socket.emit('get_game_history', sessionId, (response: { success: boolean; history?: GameHistoryEntry[]; error?: string }) => {
      setLoading(false);
      
      if (response.success && response.history) {
        setHistory(response.history.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })));
      } else {
        setError(response.error || 'Failed to fetch game history');
      }
    });
  }, [sessionId]);

  return {
    history,
    loading,
    error,
    fetchHistory
  };
} 