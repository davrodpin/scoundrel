import { v4 as uuidv4 } from 'uuid';
import { GameSession, GameState, GameAction } from '../types/game';
import type { GameCard, Monster, Weapon, HealthPotion, Suit, Rank } from '../types/cards';
import { gameReducer, initialState } from '../reducers/gameReducer';
import { initializeDeck } from '../utils/deck';
import { gameActionValidator } from './GameActionValidator';
import { securityService } from './SecurityService';
import { GameSessionModel } from '../models/GameSession';
import { GameStateHistoryModel } from '../models/GameStateHistory';

const isDevelopment = process.env.NODE_ENV !== 'production';

export class GameService {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  async createGame(playerId: string): Promise<GameSession> {
    if (isDevelopment) {
      console.log('[DEBUG] Starting game creation for player:', playerId);
    }

    try {
      const session = new GameSessionModel({
        playerId,
        state: {
          ...initialState,
          dungeon: initializeDeck(),
          lastActionTimestamp: Date.now(),
          lastActionSequence: 0,
          stateChecksum: '' // Temporary value, will be updated below
        },
        actionCount: 0,
        lastActionTime: Date.now(),
        actionsInLastMinute: 0
      });

      // Set the sessionId in the state after we have the session's ID
      session.state.sessionId = session.id;

      // Calculate and set the initial checksum
      session.state.stateChecksum = securityService.calculateStateChecksum(session.state);

      if (isDevelopment) {
        console.log('[DEBUG] Created initial game state:', {
          dungeonSize: session.state.dungeon.length,
          health: session.state.health,
          maxHealth: session.state.maxHealth,
          checksum: session.state.stateChecksum
        });
      }

      await session.save();

      // Save initial state in history
      try {
        const initialState = {
          s: session.id,                    // sessionId
          p: playerId,                      // playerId
          seq: 0,                           // Initial state has sequence 0
          st: {                             // Complete initial state
            h: session.state.health,        // health
            m: session.state.maxHealth,     // maxHealth
            d: session.state.dungeon.map(card => ({
              t: card.type,
              s: card.suit,
              r: card.rank,
              d: 'damage' in card ? card.damage : undefined,
              h: 'healing' in card ? card.healing : undefined
            })),
            r: session.state.room.map(card => ({
              t: card.type,
              s: card.suit,
              r: card.rank,
              d: 'damage' in card ? card.damage : undefined,
              h: 'healing' in card ? card.healing : undefined
            })),
            w: session.state.equippedWeapon ? {
              t: session.state.equippedWeapon.type,
              s: session.state.equippedWeapon.suit,
              r: session.state.equippedWeapon.rank,
              d: session.state.equippedWeapon.damage
            } : undefined,
            dp: session.state.discardPile.map(card => ({
              t: card.type,
              s: card.suit,
              r: card.rank,
              d: 'damage' in card ? card.damage : undefined,
              h: 'healing' in card ? card.healing : undefined
            })),
            sc: 0  // Initial score
          },
          t: new Date()
        };

        if (isDevelopment) {
          console.log('[DEBUG] Saving initial game state to history:', {
            sessionId: initialState.s,
            playerId: initialState.p,
            sequence: initialState.seq,
            health: initialState.st.h,
            maxHealth: initialState.st.m,
            dungeonSize: initialState.st.d.length,
            roomSize: initialState.st.r.length,
            discardPileSize: initialState.st.dp.length,
            score: initialState.st.sc,
            timestamp: initialState.t
          });
        }

        await GameStateHistoryModel.create(initialState);

        if (isDevelopment) {
          console.log('[DEBUG] Saved initial game state to history');
        }
      } catch (error) {
        console.error('[DEBUG] Failed to save initial game state history:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          sessionId: session.id,
          playerId,
          health: session.state.health,
          maxHealth: session.state.maxHealth,
          dungeonSize: session.state.dungeon.length
        });
        // Don't throw here - we want to continue even if history saving fails
      }

      if (isDevelopment) {
        console.log('[DEBUG] Game session saved successfully:', {
          sessionId: session.id,
          playerId,
          initialHealth: session.state.health,
          dungeonSize: session.state.dungeon.length,
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

      // Save action in state history
      try {
        type HistoryAction = {
          t: string;
          ts: number;
          m?: {
            t: string;
            s: string;
            r: string;
            d: number;
          };
          w?: {
            t: string;
            s: string;
            r: string;
            d: number;
          };
          h?: number;
          // Add drawn cards for DRAW_ROOM action
          c?: Array<{
            t: string;
            s: string;
            r: string;
            d?: number;
            h?: number;
          }>;
        };

        type HistoryEntry = {
          s: string;
          p: string;
          seq: number;
          a: HistoryAction;
          t: Date;
        };

        const historyEntry: HistoryEntry = {
          s: session.id,                    // sessionId
          p: session.playerId,              // playerId
          seq: action.sequence,             // Action sequence number
          a: {                              // Action details
            t: action.type,                 // action type
            ts: action.timestamp,           // action timestamp
            ...(action.type === 'DRAW_ROOM' ? {
              c: newState.room.map(card => ({
                t: card.type,
                s: card.suit,
                r: card.rank,
                ...(card.type === 'MONSTER' ? { d: card.damage } : {}),
                ...(card.type === 'HEALTH_POTION' ? { h: card.healing } : {}),
                ...(card.type === 'WEAPON' ? { d: card.damage } : {})
              }))
            } : {}),
            ...(action.monster ? {
              m: {
                t: action.monster.type,
                s: action.monster.suit,
                r: action.monster.rank,
                d: action.monster.damage
              }
            } : {}),
            ...(action.weapon ? {
              w: {
                t: action.weapon.type,
                s: action.weapon.suit,
                r: action.weapon.rank,
                d: action.weapon.damage
              }
            } : {}),
            ...(action.healing ? { h: action.healing } : {})
          },
          t: new Date(action.timestamp)     // document timestamp
        };

        await GameStateHistoryModel.create(historyEntry);

        if (isDevelopment) {
          console.log('[DEBUG] Saved action to game state history:', {
            sessionId,
            sequence: action.sequence,
            actionType: action.type,
            ...(action.type === 'DRAW_ROOM' ? {
              drawnCards: newState.room.map(card => ({
                type: card.type,
                suit: card.suit,
                rank: card.rank
              }))
            } : {})
          });
        }
      } catch (error) {
        console.error('[DEBUG] Failed to save game state history:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
        // Don't throw here - we want to continue even if history saving fails
      }

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
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }

      return newState;
    } catch (error) {
      if (isDevelopment) {
        console.error('[DEBUG] Error in handleAction:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          sessionId,
          actionType: action.type
        });
      }
      throw error;
    }
  }

  // Add method to retrieve game history
  async getGameHistory(sessionId: string): Promise<{ state: GameState; action: GameAction; timestamp: number }[]> {
    const entries = await GameStateHistoryModel.find({ s: sessionId }).sort({ seq: 1 }).lean();
    
    const convertCard = (card: any): GameCard => {
      const baseCard = {
        suit: card.s === 'S' ? '♠' : card.s === 'H' ? '♥' : card.s === 'D' ? '♦' : '♣' as Suit,
        rank: card.r as Rank
      };

      switch (card.t) {
        case 'M':
          return {
            ...baseCard,
            type: 'MONSTER',
            damage: card.d
          } as Monster;
        case 'W':
          return {
            ...baseCard,
            type: 'WEAPON',
            damage: card.d,
            monstersSlain: []
          } as Weapon;
        case 'H':
          return {
            ...baseCard,
            type: 'HEALTH_POTION',
            healing: card.h
          } as HealthPotion;
        default:
          throw new Error(`Unknown card type: ${card.t}`);
      }
    };

    return entries.map(entry => {
      // For initial state (seq = 0)
      if (entry.seq === 0 && entry.st) {
        const state: GameState = {
          health: entry.st.h,
          maxHealth: entry.st.m,
          dungeon: (entry.st.d || []).map(convertCard),
          room: (entry.st.r || []).map(convertCard),
          discardPile: (entry.st.dp || []).map(convertCard),
          equippedWeapon: entry.st.w ? convertCard(entry.st.w) as Weapon : null,
          canAvoidRoom: true,
          gameOver: false,
          score: entry.st.sc || 0,
          originalRoomSize: entry.st.r?.length || 0,
          remainingAvoids: 1,
          lastActionWasAvoid: false,
          lastActionTimestamp: entry.t.getTime(),
          lastActionSequence: entry.seq,
          stateChecksum: '',
          sessionId
        };

        return {
          state,
          action: {
            type: 'DRAW_ROOM',
            timestamp: entry.t.getTime(),
            sequence: 0
          },
          timestamp: entry.t.getTime()
        };
      }

      // For action entries (seq > 0)
      const action: GameAction = entry.a ? {
        type: entry.a.t === 'DRAW_ROOM' ? 'DRAW_ROOM' :
              entry.a.t === 'AVOID_ROOM' ? 'AVOID_ROOM' :
              entry.a.t === 'FIGHT_MONSTER' ? 'FIGHT_MONSTER' :
              entry.a.t === 'USE_WEAPON' ? 'USE_WEAPON' :
              entry.a.t === 'USE_HEALTH_POTION' ? 'USE_HEALTH_POTION' :
              'EQUIP_WEAPON',
        monster: entry.a.m ? convertCard(entry.a.m) as Monster : undefined,
        weapon: entry.a.w ? convertCard(entry.a.w) as Weapon : undefined,
        healing: entry.a.h,
        timestamp: entry.a.ts,
        sequence: entry.seq
      } : {
        type: 'DRAW_ROOM',
        timestamp: entry.t.getTime(),
        sequence: entry.seq
      };

      // For action entries, we need to reconstruct the state by applying the action
      // This should be handled by the game reducer
      const state = gameReducer(initialState, action);

      return {
        state,
        action,
        timestamp: entry.t.getTime()
      };
    });
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