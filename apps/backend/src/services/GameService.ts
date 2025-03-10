import { v4 as uuidv4 } from 'uuid';
import { GameSession, GameState, GameAction } from '../types/game';
import { gameReducer, initialState } from '../reducers/gameReducer';
import { initializeDeck } from '../utils/deck';

export class GameService {
  private sessions: Map<string, GameSession> = new Map();

  createGame(playerId: string): GameSession {
    const session: GameSession = {
      id: uuidv4(),
      state: {
        ...initialState,
        dungeon: initializeDeck()
      },
      playerId,
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getGame(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  handleAction(sessionId: string, action: GameAction): GameState {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Game session not found');
    }

    const newState = gameReducer(session.state, action);
    session.state = newState;
    session.lastUpdatedAt = new Date();
    
    this.sessions.set(sessionId, session);
    return newState;
  }
} 