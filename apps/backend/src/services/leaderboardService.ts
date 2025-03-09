import { LeaderboardEntry, CreateLeaderboardEntryDto } from '../types/leaderboard.js';
import crypto from 'crypto';

class LeaderboardService {
  private entries: LeaderboardEntry[] = [];

  addEntry(entry: CreateLeaderboardEntryDto): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      playerName: entry.playerName,
      score: entry.score,
      timestamp: new Date().toISOString()
    };

    this.entries.push(newEntry);
    this.entries.sort((a, b) => b.score - a.score);
    return newEntry;
  }

  getEntries(): LeaderboardEntry[] {
    return this.entries;
  }
}

export const leaderboardService = new LeaderboardService(); 