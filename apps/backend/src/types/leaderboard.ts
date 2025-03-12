export interface LeaderboardEntry {
  id: string;
  playerName: string;
  playerId: string;
  sessionId: string;
  score: number;
  timestamp: string;
}

export interface CreateLeaderboardEntryDto {
  playerName: string;
  playerId: string;
  sessionId: string;
  score: number;
} 