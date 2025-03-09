export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timestamp: string;
}

export interface CreateLeaderboardEntryDto {
  playerName: string;
  score: number;
} 