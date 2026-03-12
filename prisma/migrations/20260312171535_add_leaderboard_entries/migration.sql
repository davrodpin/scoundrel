-- DropForeignKey
ALTER TABLE "game_events" DROP CONSTRAINT "game_events_game_id_fkey";

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" SERIAL NOT NULL,
    "game_id" UUID NOT NULL,
    "player_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leaderboard_entries_score_idx" ON "leaderboard_entries"("score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_game_id_key" ON "leaderboard_entries"("game_id");

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing completed games into leaderboard_entries
INSERT INTO leaderboard_entries (game_id, player_name, score, completed_at)
SELECT id, player_name, score, updated_at
FROM games
WHERE status = 'completed' AND score IS NOT NULL
ON CONFLICT (game_id) DO NOTHING;
