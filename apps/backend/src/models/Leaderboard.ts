import mongoose, { Schema, Document } from 'mongoose';

interface LeaderboardEntry extends Document {
  playerName: string;
  playerId: string;
  sessionId: string;
  score: number;
  timestamp: Date;
}

const leaderboardSchema = new Schema({
  playerName: { type: String, required: true },
  playerId: { type: String, required: true },
  sessionId: { type: String, required: true },
  score: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Compound index for efficient leaderboard queries
leaderboardSchema.index({ score: -1, timestamp: -1 });

export const LeaderboardModel = mongoose.model<LeaderboardEntry>('Leaderboard', leaderboardSchema); 