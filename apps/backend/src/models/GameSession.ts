import mongoose, { Schema, Document } from 'mongoose';
import { GameState, GameSession as IGameSession } from '../types/game';
import { getCollectionName } from '../utils/dbUtils';

interface GameSessionDocument extends Document, Omit<IGameSession, 'id'> {
  createdAt: Date;
  lastUpdatedAt: Date;
}

const gameStateSchema = new Schema({
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
}, { _id: false });

const gameSessionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  playerId: { type: String, required: true },
  state: {
    health: { type: Number, required: true },
    maxHealth: { type: Number, required: true },
    dungeon: [{
      type: { type: String, required: true },
      suit: { type: String, required: true },
      rank: { type: String, required: true },
      damage: Number,
      healing: Number,
      monstersSlain: [{
        type: { type: String, required: true },
        suit: { type: String, required: true },
        rank: { type: String, required: true },
        damage: Number
      }]
    }],
    room: [{
      type: { type: String, required: true },
      suit: { type: String, required: true },
      rank: { type: String, required: true },
      damage: Number,
      healing: Number
    }],
    discardPile: [{
      type: { type: String, required: true },
      suit: { type: String, required: true },
      rank: { type: String, required: true },
      damage: Number,
      healing: Number
    }],
    equippedWeapon: {
      type: { type: String },
      suit: { type: String },
      rank: { type: String },
      damage: Number,
      monstersSlain: [{
        type: { type: String },
        suit: { type: String },
        rank: { type: String },
        damage: Number
      }]
    },
    canAvoidRoom: { type: Boolean, required: true },
    gameOver: { type: Boolean, required: true },
    score: { type: Number, required: true },
    originalRoomSize: { type: Number, required: true },
    remainingAvoids: { type: Number, required: true },
    lastActionWasAvoid: { type: Boolean, required: true },
    lastActionTimestamp: { type: Number, required: true },
    lastActionSequence: { type: Number, required: true },
    stateChecksum: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
  actionCount: { type: Number, default: 0 },
  lastActionTime: { type: Number, default: 0 },
  actionsInLastMinute: { type: Number, default: 0 }
}, {
  timestamps: false
});

// Add TTL index to automatically remove inactive sessions after 24 hours
gameSessionSchema.index({ lastUpdatedAt: 1 }, { expires: '24h' });

// Add compound index for efficient querying
gameSessionSchema.index({ playerId: 1, lastUpdatedAt: -1 });

export const GameSessionModel = mongoose.model<GameSessionDocument>(
  'GameSession',
  gameSessionSchema,
  getCollectionName('game_sessions')
); 