import { v4 as uuidv4 } from 'uuid';
import { GameSession, GameState, GameAction } from '../types/game';
import { gameReducer, initialState } from '../reducers/gameReducer';
import { initializeDeck } from '../utils/deck';
import { gameActionValidator } from './GameActionValidator';
import { securityService } from './SecurityService';

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

    this.sessions.set(session.id, session);
    return session;
  }

  getGame(sessionId: string): GameSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    // Check if session has expired
    const now = new Date().getTime();
    const lastActivity = session.lastUpdatedAt.getTime();
    if (now - lastActivity > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    // Validate state integrity
    const checksumError = securityService.validateStateChecksum(session.state);
    if (checksumError) {
      this.sessions.delete(sessionId);
      throw new Error('Game state integrity violation detected');
    }

    return session;
  }

  handleAction(sessionId: string, action: GameAction): GameState {
    const session = this.getGame(sessionId);
    if (!session) {
      throw new Error('Game session not found or has expired');
    }

    // Security validations
    const rateError = securityService.validateActionRate(session);
    if (rateError) {
      throw new Error(rateError);
    }

    const timestampError = securityService.validateActionTimestamp(action);
    if (timestampError) {
      throw new Error(timestampError);
    }

    const sequenceError = securityService.validateActionSequence(session, action);
    if (sequenceError) {
      throw new Error(sequenceError);
    }

    // Game logic validation
    const validationError = gameActionValidator.validateAction(session.state, action);
    if (validationError) {
      throw new Error(validationError);
    }

    // Update state
    const newState = gameReducer(session.state, action);
    
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