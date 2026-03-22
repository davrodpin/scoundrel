-- Remove duplicate (player_name, score) entries, keeping the earliest
DELETE FROM leaderboard_entries
WHERE id NOT IN (
  SELECT MIN(id)
  FROM leaderboard_entries
  GROUP BY player_name, score
);

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_player_name_score_key" ON "leaderboard_entries"("player_name", "score");
