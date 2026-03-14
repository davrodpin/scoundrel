import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type {
  LeaderboardEntry,
  LeaderboardRank,
} from "@scoundrel/game-service";
import { LeaderboardTable } from "../components/game/LeaderboardTable.tsx";
import { getLeaderboardStatusMessage } from "../components/game/leaderboard_panel_utils.ts";

type LeaderboardProps = {
  gameId?: string;
};

export default function Leaderboard({ gameId }: LeaderboardProps) {
  const entries = useSignal<LeaderboardEntry[]>([]);
  const loading = useSignal(true);
  const playerRank = useSignal<LeaderboardRank | null>(null);

  useEffect(() => {
    async function load() {
      loading.value = true;
      try {
        if (gameId) {
          const [leaderboardRes, rankRes] = await Promise.all([
            fetch("/api/leaderboard"),
            fetch(`/api/leaderboard?gameId=${gameId}`),
          ]);
          if (leaderboardRes.ok) {
            entries.value = await leaderboardRes.json() as LeaderboardEntry[];
          }
          if (rankRes.ok) {
            const rankData = await rankRes.json() as LeaderboardRank | null;
            playerRank.value = rankData;
          }
        } else {
          const res = await fetch("/api/leaderboard");
          if (res.ok) {
            entries.value = await res.json() as LeaderboardEntry[];
          }
        }
      } catch {
        // Non-critical — silently fail
      } finally {
        loading.value = false;
      }
    }

    load();
  }, []);

  const extraEntry = playerRank.value != null
    ? { entry: playerRank.value.entry, rank: playerRank.value.rank }
    : null;

  const statusMessage = getLeaderboardStatusMessage(
    loading.value,
    entries.value.length,
  );

  return (
    <div class="min-h-screen bg-dungeon-bg text-parchment p-4 md:p-8">
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="font-heading text-3xl text-torch-amber">Hall of Fame</h1>
          <a
            href="/play"
            class="text-sm font-body text-parchment-dark hover:text-parchment transition-colors duration-200"
          >
            &larr; Back
          </a>
        </div>

        <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-4">
          {statusMessage !== null
            ? (
              <p class="text-parchment-dark font-body text-sm text-center py-8">
                {statusMessage}
              </p>
            )
            : (
              <LeaderboardTable
                entries={entries.value}
                highlightGameId={gameId ?? null}
                extraEntry={extraEntry}
              />
            )}
        </div>
      </div>
    </div>
  );
}
