import mongoose, { Schema, Document } from 'mongoose';
import { GameState, GameSession as IGameSession } from '../types/game';

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
  playerId: { type: String, required: true, index: true },
  state: { type: gameStateSchema, required: true },
  actionCount: { type: Number, default: 0 },
  lastActionTime: { type: Number, default: Date.now },
  actionsInLastMinute: { type: Number, default: 0 }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: 'lastUpdatedAt'
  }
});

// Add TTL index to automatically remove sessions after 24 hours of inactivity
gameSessionSchema.index({ lastUpdatedAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const GameSessionModel = mongoose.model<GameSessionDocument>('GameSession', gameSessionSchema); 