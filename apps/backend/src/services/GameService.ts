import { v4 as uuidv4 } from 'uuid';
import { GameSession, GameState, GameAction } from '../types/game';
import { gameReducer, initialState } from '../reducers/gameReducer';
import { initializeDeck } from '../utils/deck';
import { gameActionValidator } from './GameActionValidator';
import { securityService } from './SecurityService';
import { GameSessionModel } from '../models/GameSession';

const isDevelopment = process.env.NODE_ENV !== 'production';

export class GameService {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  async createGame(playerId: string): Promise<GameSession> {
    if (isDevelopment) {
      console.log('[DEBUG] Starting game creation for player:', playerId);
    }

    try {
      const initialGameState: GameState = {
        ...initialState,
        dungeon: initializeDeck(),
        lastActionTimestamp: Date.now(),
        lastActionSequence: 0,
        stateChecksum: '' // Temporary value, will be updated below
      };

      // Calculate and set the initial checksum
      initialGameState.stateChecksum = securityService.calculateStateChecksum(initialGameState);

      if (isDevelopment) {
        console.log('[DEBUG] Created initial game state:', {
          dungeonSize: initialGameState.dungeon.length,
          health: initialGameState.health,
          maxHealth: initialGameState.maxHealth,
          checksum: initialGameState.stateChecksum
        });
      }

      const session = new GameSessionModel({
        playerId,
        state: initialGameState,
        actionCount: 0,
        lastActionTime: Date.now(),
        actionsInLastMinute: 0
      });

      await session.save();

      if (isDevelopment) {
        console.log('[DEBUG] Game session saved successfully:', {
          sessionId: session.id,
          playerId,
          initialHealth: initialGameState.health,
          dungeonSize: initialGameState.dungeon.length,
          timestamp: new Date().toISOString()
        });
      }

      return this.convertToGameSession(session);
    } catch (error) {
      if (isDevelopment) {
        console.error('[DEBUG] Error in createGame:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          playerId
        });
      }
      throw error;
    }
  }

  async getGame(sessionId: string): Promise<GameSession | undefined> {
    const session = await GameSessionModel.findById(sessionId);
    
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
      await session.deleteOne();
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
      await session.deleteOne();
      throw new Error('Game state integrity violation detected');
    }

    return this.convertToGameSession(session);
  }

  async handleAction(sessionId: string, action: GameAction): Promise<GameState> {
    try {
      const session = await GameSessionModel.findById(sessionId);
      
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
          roomCards: session.state.room,
          equippedWeapon: session.state.equippedWeapon,
          discardPile: session.state.discardPile
        });
      }

      const gameSession = this.convertToGameSession(session);

      // Security validations
      const rateError = securityService.validateActionRate(gameSession);
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

      const sequenceError = securityService.validateActionSequence(gameSession, action);
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
        console.log('[DEBUG] State after reducer:', {
          sessionId,
          actionType: action.type,
          oldHealth: session.state.health,
          newHealth: newState.health,
          maxHealth: newState.maxHealth,
          roomCards: newState.room,
          equippedWeapon: newState.equippedWeapon,
          discardPile: newState.discardPile
        });
      }
      
      // Update security-related fields
      newState.lastActionTimestamp = action.timestamp;
      newState.lastActionSequence = action.sequence;
      newState.stateChecksum = securityService.calculateStateChecksum(newState);

      // Update session in database
      session.state = newState;
      session.lastActionTime = Date.now();
      session.actionCount += 1;
      session.actionsInLastMinute = gameSession.actionsInLastMinute + 1;
      
      try {
        await session.save();
      } catch (error) {
        console.error('[DEBUG] Mongoose save error:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          state: {
            equippedWeapon: newState.equippedWeapon,
            discardPile: newState.discardPile,
            room: newState.room
          }
        });
        throw error;
      }
      
      return newState;
    } catch (error) {
      console.error('[DEBUG] handleAction error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        action: {
          type: action.type,
          weapon: action.weapon
        }
      });
      throw error;
    }
  }

  private convertToGameSession(doc: any): GameSession {
    return {
      id: doc._id.toString(),
      playerId: doc.playerId,
      state: doc.state,
      createdAt: doc.createdAt,
      lastUpdatedAt: doc.lastUpdatedAt,
      actionCount: doc.actionCount,
      lastActionTime: doc.lastActionTime,
      actionsInLastMinute: doc.actionsInLastMinute
    };
  }
} 