import { createHash } from 'crypto';
import { GameState, GameAction, GameSession } from '../types/game';

const isDevelopment = process.env.NODE_ENV !== 'production';

export class SecurityService {
  private readonly MAX_ACTIONS_PER_MINUTE = 60; // Maximum actions allowed per minute
  private readonly ACTION_WINDOW = 60 * 1000; // 1 minute in milliseconds
  private readonly MAX_TIMESTAMP_DRIFT = 30 * 1000; // 30 seconds maximum time drift

  validateActionRate(session: GameSession): string | null {
    const now = Date.now();
    
    if (isDevelopment) {
      console.log('[DEBUG] Validating action rate:', {
        actionsInLastMinute: session.actionsInLastMinute,
        timeSinceLastAction: now - session.lastActionTime,
        maxActions: this.MAX_ACTIONS_PER_MINUTE
      });
    }

    // Reset counter if window has passed
    if (now - session.lastActionTime > this.ACTION_WINDOW) {
      session.actionsInLastMinute = 0;
      session.lastActionTime = now;
    }

    // Check rate limit
    if (session.actionsInLastMinute >= this.MAX_ACTIONS_PER_MINUTE) {
      return 'Rate limit exceeded. Please wait before performing more actions.';
    }

    return null;
  }

  validateActionTimestamp(action: GameAction): string | null {
    const now = Date.now();
    const drift = Math.abs(now - action.timestamp);

    if (isDevelopment) {
      console.log('[DEBUG] Validating action timestamp:', {
        actionTime: new Date(action.timestamp).toISOString(),
        serverTime: new Date(now).toISOString(),
        drift,
        maxDrift: this.MAX_TIMESTAMP_DRIFT
      });
    }

    if (drift > this.MAX_TIMESTAMP_DRIFT) {
      return 'Action timestamp is too far from server time';
    }

    return null;
  }

  validateActionSequence(session: GameSession, action: GameAction): string | null {
    if (isDevelopment) {
      console.log('[DEBUG] Validating action sequence:', {
        expectedSequence: session.state.lastActionSequence + 1,
        receivedSequence: action.sequence,
        actionType: action.type
      });
    }

    if (action.sequence !== session.state.lastActionSequence + 1) {
      return 'Invalid action sequence number';
    }

    return null;
  }

  calculateStateChecksum(state: GameState): string {
    // Create a deterministic string representation of the state
    // excluding only the checksum itself
    const { stateChecksum, ...stateForChecksum } = state;

    if (isDevelopment) {
      console.log('[DEBUG] State for checksum calculation:', {
        health: state.health,
        maxHealth: state.maxHealth,
        roomCards: state.room.map(card => ({
          type: card.type,
          suit: card.suit,
          rank: card.rank
        })),
        equippedWeapon: state.equippedWeapon ? {
          type: state.equippedWeapon.type,
          suit: state.equippedWeapon.suit,
          rank: state.equippedWeapon.rank,
          damage: state.equippedWeapon.damage
        } : null,
        lastActionTimestamp: new Date(state.lastActionTimestamp).toISOString(),
        lastActionSequence: state.lastActionSequence
      });
    }

    const stateString = JSON.stringify(stateForChecksum);
    const checksum = createHash('sha256').update(stateString).digest('hex');
    
    if (isDevelopment) {
      console.log('[DEBUG] Checksum calculation:', {
        oldChecksum: state.stateChecksum,
        newChecksum: checksum,
        stateString: stateString.substring(0, 200) + '...' // Show first 200 chars only
      });
    }

    return checksum;
  }

  validateStateChecksum(state: GameState): string | null {
    if (isDevelopment) {
      console.log('[DEBUG] Validating state checksum:', {
        health: state.health,
        maxHealth: state.maxHealth,
        roomCards: state.room.map(card => ({
          type: card.type,
          suit: card.suit,
          rank: card.rank
        })),
        lastActionTimestamp: new Date(state.lastActionTimestamp).toISOString(),
        lastActionSequence: state.lastActionSequence,
        currentChecksum: state.stateChecksum
      });
    }

    const calculatedChecksum = this.calculateStateChecksum(state);
    if (calculatedChecksum !== state.stateChecksum) {
      if (isDevelopment) {
        console.log('[DEBUG] Checksum validation failed:', {
          expected: calculatedChecksum,
          actual: state.stateChecksum,
          difference: 'Checksums do not match'
        });
      }
      return 'State integrity check failed';
    }

    if (isDevelopment) {
      console.log('[DEBUG] Checksum validation passed');
    }
    return null;
  }

  updateSessionStats(session: GameSession, action: GameAction): void {
    const now = Date.now();
    
    if (isDevelopment) {
      console.log('[DEBUG] Updating session stats:', {
        sessionId: session.id,
        actionType: action.type,
        newActionCount: session.actionCount + 1,
        newSequence: action.sequence,
        timestamp: new Date(action.timestamp).toISOString()
      });
    }
    
    if (now - session.lastActionTime > this.ACTION_WINDOW) {
      session.actionsInLastMinute = 1;
    } else {
      session.actionsInLastMinute++;
    }
    
    session.lastActionTime = now;
    session.actionCount++;
    session.state.lastActionSequence = action.sequence;
    session.state.lastActionTimestamp = action.timestamp;
  }
}

export const securityService = new SecurityService(); 