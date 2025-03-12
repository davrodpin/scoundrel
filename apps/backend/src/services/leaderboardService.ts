import { LeaderboardModel } from '../models/Leaderboard';

const isDevelopment = process.env.NODE_ENV !== 'production';

export class LeaderboardService {
  private readonly MAX_ENTRIES = 100;

  async getEntries() {
    // Only fetch top 10 scores, sorted by score in descending order
    const entries = await LeaderboardModel
      .find({}, {}, { 
        sort: { score: -1 },
        limit: 10,
        lean: true,
        projection: {
          playerName: 1,
          playerId: 1,
          sessionId: 1,
          score: 1,
          timestamp: 1
        }
      });

    if (isDevelopment) {
      console.log('[DEBUG] Retrieved top 10 leaderboard entries:', entries.length);
    }

    return entries.map(entry => ({
      id: entry._id.toString(),
      playerName: entry.playerName,
      playerId: entry.playerId,
      sessionId: entry.sessionId,
      score: entry.score,
      timestamp: entry.timestamp.toISOString()
    }));
  }

  async addEntry({ playerName, playerId, sessionId, score }: { playerName: string; playerId: string; sessionId: string; score: number }) {
    if (!playerName || !playerId || !sessionId || typeof score !== 'number') {
      throw new Error('Invalid leaderboard entry data');
    }

    const entry = new LeaderboardModel({
      playerName,
      playerId,
      sessionId,
      score,
      timestamp: new Date()
    });

    await entry.save();

    if (isDevelopment) {
      console.log('[DEBUG] Added new leaderboard entry:', {
        playerName,
        playerId,
        sessionId,
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