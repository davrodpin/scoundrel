import { v4 as uuidv4 } from 'uuid';
import { GameSession, GameState, GameAction } from '../types/game';
import { gameReducer, initialState } from '../reducers/gameReducer';
import { initializeDeck } from '../utils/deck';
import { gameActionValidator } from './GameActionValidator';
import { securityService } from './SecurityService';

const isDevelopment = process.env.NODE_ENV !== 'production';

export class GameService {
  private sessions: Map<string, GameSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  private cleanupExpiredSessions() {
    const now = new Date().getTime();
    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = session.lastUpdatedAt.getTime();
      if (now - lastActivity > this.SESSION_TIMEOUT) {
        if (isDevelopment) {
          console.log('[DEBUG] Cleaning up expired session:', {
            sessionId,
            lastActivity: new Date(lastActivity).toISOString(),
            now: new Date(now).toISOString(),
            timeSinceLastActivity: now - lastActivity
          });
        }
        this.sessions.delete(sessionId);
      }
    }
  }

  createGame(playerId: string): GameSession {
    // Clean up expired sessions before creating a new one
    this.cleanupExpiredSessions();

    const initialGameState: GameState = {
      ...initialState,
      dungeon: initializeDeck(),
      lastActionTimestamp: Date.now(),
      lastActionSequence: 0,
      stateChecksum: '' // Temporary value, will be updated below
    };

    // Calculate and set the initial checksum
    initialGameState.stateChecksum = securityService.calculateStateChecksum(initialGameState);

    const session: GameSession = {
      id: uuidv4(),
      state: initialGameState,
      playerId,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      actionCount: 0,
      lastActionTime: Date.now(),
      actionsInLastMinute: 0
    };

    if (isDevelopment) {
      console.log('[DEBUG] Creating new game session:', {
        sessionId: session.id,
        playerId,
        initialHealth: initialGameState.health,
        dungeonSize: initialGameState.dungeon.length,
        timestamp: new Date().toISOString()
      });
    }

    this.sessions.set(session.id, session);
    return session;
  }

  getGame(sessionId: string): GameSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      if (isDevelopment) {
        console.log('[DEBUG] Session not found:', sessionId);
      }
      return undefined;
    }

    // Check if session has expired
    const now = new Date().getTime();
    const lastActivity = session.lastUpdatedAt.getTime();
    if (now - lastActivity > this.SESSION_TIMEOUT) {
      if (isDevelopment) {
        console.log('[DEBUG] Session expired:', {
          sessionId,
          lastActivity: new Date(lastActivity).toISOString(),
          now: new Date(now).toISOString(),
          timeSinceLastActivity: now - lastActivity
        });
      }
      this.sessions.delete(sessionId);
      return undefined;
    }

    // Validate state integrity
    const checksumError = securityService.validateStateChecksum(session.state);
    if (checksumError) {
      if (isDevelopment) {
        console.log('[DEBUG] State integrity violation:', {
          sessionId,
          error: checksumError,
          state: {
            health: session.state.health,
            maxHealth: session.state.maxHealth,
            roomSize: session.state.room.length,
            dungeonSize: session.state.dungeon.length
          }
        });
      }
      this.sessions.delete(sessionId);
      throw new Error('Game state integrity violation detected');
    }

    return session;
  }

  handleAction(sessionId: string, action: GameAction): GameState {
    const session = this.getGame(sessionId);
    if (!session) {
      if (isDevelopment) {
        console.log('[DEBUG] Session not found for action:', {
          sessionId,
          actionType: action.type,
          timestamp: new Date(action.timestamp).toISOString()
        });
      }
      throw new Error('Game session not found or has expired');
    }

    if (isDevelopment) {
      console.log('[DEBUG] Processing action:', {
        sessionId,
        actionType: action.type,
        currentHealth: session.state.health,
        maxHealth: session.state.maxHealth,
        roomCards: session.state.room.map(card => ({
          type: card.type,
          suit: card.suit,
          rank: card.rank
        }))
      });
    }

    // Security validations
    const rateError = securityService.validateActionRate(session);
    if (rateError) {
      if (isDevelopment) {
        console.log('[DEBUG] Rate limit error:', {
          sessionId,
          error: rateError,
          actionsInLastMinute: session.actionsInLastMinute
        });
      }
      throw new Error(rateError);
    }

    const timestampError = securityService.validateActionTimestamp(action);
    if (timestampError) {
      if (isDevelopment) {
        console.log('[DEBUG] Timestamp error:', {
          sessionId,
          error: timestampError,
          actionTime: new Date(action.timestamp).toISOString()
        });
      }
      throw new Error(timestampError);
    }

    const sequenceError = securityService.validateActionSequence(session, action);
    if (sequenceError) {
      if (isDevelopment) {
        console.log('[DEBUG] Sequence error:', {
          sessionId,
          error: sequenceError,
          expectedSequence: session.state.lastActionSequence + 1,
          receivedSequence: action.sequence
        });
      }
      throw new Error(sequenceError);
    }

    // Game logic validation
    if (isDevelopment) {
      console.log('[DEBUG] Validating game action:', {
        sessionId,
        actionType: action.type,
        currentState: {
          health: session.state.health,
          maxHealth: session.state.maxHealth,
          roomCards: session.state.room.map(card => ({
            type: card.type,
            suit: card.suit,
            rank: card.rank
          }))
        }
      });
    }
    const validationError = gameActionValidator.validateAction(session.state, action);
    if (validationError) {
      if (isDevelopment) {
        console.log('[DEBUG] Game action validation error:', {
          sessionId,
          error: validationError,
          actionType: action.type
        });
      }
      throw new Error(validationError);
    }

    // Update state
    const newState = gameReducer(session.state, action);
    
    if (isDevelopment) {
      console.log('[DEBUG] State updated:', {
        sessionId,
        actionType: action.type,
        oldHealth: session.state.health,
        newHealth: newState.health,
        maxHealth: newState.maxHealth,
        roomCards: newState.room.map(card => ({
          type: card.type,
          suit: card.suit,
          rank: card.rank
        }))
      });
    }
    
    // Update security-related fields
    newState.lastActionTimestamp = action.timestamp;
    newState.lastActionSequence = action.sequence;
    newState.stateChecksum = securityService.calculateStateChecksum(newState);

    // Update session
    session.state = newState;
    session.lastUpdatedAt = new Date();
    securityService.updateSessionStats(session, action);
    
    this.sessions.set(sessionId, session);
    return newState;
  }

  // Clean up resources when the service is destroyed
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
} 