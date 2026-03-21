import type { LeaderboardEntry } from "@scoundrel/game-service";

export type RankedLeaderboardEntry = {
  entry: LeaderboardEntry;
  rank: number;
};

export function filterLeaderboardEntries(
  entries: LeaderboardEntry[],
  query: string,
): RankedLeaderboardEntry[] {
  const ranked = entries.map((entry, i) => ({ entry, rank: i + 1 }));
  if (!query.trim()) return ranked;
  const lower = query.toLowerCase();
  return ranked.filter((r) =>
    r.entry.playerName.toLowerCase().includes(lower)
  );
}
