import { LeaderboardModel } from '../models/Leaderboard';

const isDevelopment = process.env.NODE_ENV !== 'production';

export class LeaderboardService {
  private readonly MAX_ENTRIES = 100;

  async getEntries() {
    const entries = await LeaderboardModel
      .find()
      .sort({ score: -1 })
      .limit(this.MAX_ENTRIES)
      .lean();

    if (isDevelopment) {
      console.log('[DEBUG] Retrieved leaderboard entries:', entries.length);
    }

    return entries.map(entry => ({
      id: entry._id.toString(),
      playerName: entry.playerName,
      score: entry.score,
      timestamp: entry.timestamp.toISOString()
    }));
  }

  async addEntry({ playerName, score }: { playerName: string; score: number }) {
    if (!playerName || typeof score !== 'number') {
      throw new Error('Invalid leaderboard entry data');
    }

    const entry = new LeaderboardModel({
      playerName,
      score,
      timestamp: new Date()
    });

    await entry.save();

    if (isDevelopment) {
      console.log('[DEBUG] Added new leaderboard entry:', {
        playerName,
        score,
        timestamp: entry.timestamp
      });
    }

    // Cleanup old entries if we exceed MAX_ENTRIES
    const count = await LeaderboardModel.countDocuments();
    if (count > this.MAX_ENTRIES) {
      const lowestScores = await LeaderboardModel
        .find()
        .sort({ score: 1 })
        .limit(count - this.MAX_ENTRIES);

      if (lowestScores.length > 0) {
        await LeaderboardModel.deleteMany({
          _id: { $in: lowestScores.map(entry => entry._id) }
        });

        if (isDevelopment) {
          console.log('[DEBUG] Cleaned up old leaderboard entries:', lowestScores.length);
        }
      }
    }
  }
}

export const leaderboardService = new LeaderboardService(); 