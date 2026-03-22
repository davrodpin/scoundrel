-- DropIndex
DROP INDEX "leaderboard_entries_score_idx";

-- CreateIndex
CREATE INDEX "leaderboard_entries_score_completed_at_idx" ON "leaderboard_entries"("score" DESC, "completed_at" ASC);
