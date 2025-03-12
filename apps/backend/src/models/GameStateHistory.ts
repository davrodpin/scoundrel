import mongoose, { Schema, Document } from 'mongoose';
import { GameState, GameAction } from '../types/game';

interface GameStateHistoryDocument extends Document {
  sessionId: string;
  playerId: string;
  state: GameState;
  action: GameAction;
  timestamp: Date;
}

const gameStateHistorySchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  playerId: { type: String, required: true },
  state: {
    health: Number,
    maxHealth: Number,
    dungeon: [{
      type: { type: String },
      suit: String,
      rank: String,
      damage: Number,
      healing: Number,
      monstersSlain: [{
        type: { type: String },
        suit: String,
        rank: String,
        damage: Number
      }]
    }],
    room: [{
      type: { type: String },
      suit: String,
      rank: String,
      damage: Number,
      healing: Number,
      monstersSlain: [{
        type: { type: String },
        suit: String,
        rank: String,
        damage: Number
      }]
    }],
    discardPile: [{
      type: { type: String },
      suit: String,
      rank: String,
      damage: Number,
      healing: Number,
      monstersSlain: [{
        type: { type: String },
        suit: String,
        rank: String,
        damage: Number
      }]
    }],
    equippedWeapon: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    canAvoidRoom: Boolean,
    gameOver: Boolean,
    score: Number,
    originalRoomSize: Number,
    remainingAvoids: Number,
    lastActionWasAvoid: Boolean,
    lastActionTimestamp: Number,
    lastActionSequence: Number,
    stateChecksum: String,
    sessionId: String
  },
  action: {
    type: { type: String, required: true },
    monster: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    weapon: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    healing: Number,
    timestamp: Number,
    sequence: Number
  },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: false
});

// Add TTL index to automatically remove history entries after 7 days
gameStateHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Add compound index for efficient querying
gameStateHistorySchema.index({ sessionId: 1, timestamp: -1 });

export const GameStateHistoryModel = mongoose.model<GameStateHistoryDocument>('GameStateHistory', gameStateHistorySchema); 