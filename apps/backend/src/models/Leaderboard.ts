import mongoose, { Schema, Document } from 'mongoose';

interface LeaderboardEntry extends Document {
  playerName: string;
  score: number;
  timestamp: Date;
}

const leaderboardSchema = new Schema({
  playerName: { type: String, required: true },
  score: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Index for sorting by score
leaderboardSchema.index({ score: -1 });

export const LeaderboardModel = mongoose.model<LeaderboardEntry>('Leaderboard', leaderboardSchema); 