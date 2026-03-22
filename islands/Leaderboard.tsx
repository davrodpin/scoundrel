import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { trackPageView } from "./analytics.ts";
import type {
  LeaderboardEntry,
  LeaderboardRank,
  LeaderboardResponse,
} from "@scoundrel/game-service";
import { LeaderboardTable } from "../components/game/LeaderboardTable.tsx";
import { getLeaderboardStatusMessage } from "../components/game/leaderboard_panel_utils.ts";
import { filterLeaderboardEntries } from "./leaderboard_search_utils.ts";
import BuyMeCoffeeButton from "../components/game/BuyMeCoffeeButton.tsx";

type LeaderboardProps = {
  gameId?: string;
};

export default function Leaderboard({ gameId }: LeaderboardProps) {
  const entries = useSignal<LeaderboardEntry[]>([]);
  const loading = useSignal(true);
  const playerRank = useSignal<LeaderboardRank | null>(null);
  const searchQuery = useSignal("");

  useEffect(() => {
    trackPageView("Leaderboard");
  }, []);

  useEffect(() => {
    async function load() {
      loading.value = true;
      try {
        const url = gameId
          ? `/api/leaderboard?gameId=${gameId}`
          : "/api/leaderboard";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json() as LeaderboardResponse;
          entries.value = data.entries;
          playerRank.value = data.playerRank;
        }
      } catch {
        // Non-critical — silently fail
      } finally {
        loading.value = false;
      }
    }

    load();
  }, []);

  const isSearching = searchQuery.value.trim().length > 0;
  const rankedEntries = filterLeaderboardEntries(
    entries.value,
    searchQuery.value,
  );
  const filteredEntries = rankedEntries.map((r) => r.entry);
  const entryRanks = rankedEntries.map((r) => r.rank);

  const extraEntry = !isSearching && playerRank.value != null
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
          <h1 class="font-heading text-3xl text-torch-amber">
            The Gravekeeper's Ledger
          </h1>
          <a
            href="/play"
            class="text-sm font-body text-parchment-dark hover:text-parchment transition-colors duration-200"
          >
            &larr; Back
          </a>
        </div>

        <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-4">
          <div class="mb-4">
            <input
              type="text"
              placeholder="Search for a fallen hero…"
              value={searchQuery.value}
              onInput={(e) => {
                searchQuery.value = (e.target as HTMLInputElement).value;
              }}
              class="w-full bg-dungeon-bg border border-dungeon-border rounded-sm px-3 py-2 text-parchment font-body text-base placeholder:text-parchment-dark/50 focus:border-torch-amber focus:outline-none transition-colors duration-200"
            />
          </div>

          {statusMessage !== null
            ? (
              <p class="text-parchment-dark font-body text-sm text-center py-8">
                {statusMessage}
              </p>
            )
            : isSearching && filteredEntries.length === 0
            ? (
              <p class="text-parchment-dark font-body text-sm text-center py-8">
                No fallen heroes by that name were found in the ledger.
              </p>
            )
            : (
              <LeaderboardTable
                entries={filteredEntries}
                highlightGameId={gameId ?? null}
                extraEntry={extraEntry}
                showDungeonLink={!!gameId}
                entryRanks={isSearching ? entryRanks : undefined}
              />
            )}
        </div>
        <BuyMeCoffeeButton />
      </div>
    </div>
  );
}
