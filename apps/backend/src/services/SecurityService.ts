import { createHash } from 'crypto';
import { GameState, GameAction, GameSession } from '../types/game';

export class SecurityService {
  private readonly MAX_ACTIONS_PER_MINUTE = 60; // Maximum actions allowed per minute
  private readonly ACTION_WINDOW = 60 * 1000; // 1 minute in milliseconds
  private readonly MAX_TIMESTAMP_DRIFT = 30 * 1000; // 30 seconds maximum time drift

  validateActionRate(session: GameSession): string | null {
    const now = Date.now();
    
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

    if (drift > this.MAX_TIMESTAMP_DRIFT) {
      return 'Action timestamp is too far from server time';
    }

    return null;
  }

  validateActionSequence(session: GameSession, action: GameAction): string | null {
    if (action.sequence !== session.state.lastActionSequence + 1) {
      return 'Invalid action sequence number';
    }

    return null;
  }

  calculateStateChecksum(state: GameState): string {
    // Create a deterministic string representation of the state
    // excluding the checksum itself and timing-related fields
    const { stateChecksum, lastActionTimestamp, ...stateForChecksum } = state;

    const stateString = JSON.stringify(stateForChecksum);
    return createHash('sha256').update(stateString).digest('hex');
  }

  validateStateChecksum(state: GameState): string | null {
    const calculatedChecksum = this.calculateStateChecksum(state);
    if (calculatedChecksum !== state.stateChecksum) {
      return 'State integrity check failed';
    }

    return null;
  }

  updateSessionStats(session: GameSession, action: GameAction): void {
    const now = Date.now();
    
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