import type { LeaderboardEntry } from "@scoundrel/game-service";
import { getLeaderboardStatusMessage } from "./leaderboard_panel_utils.ts";
import { LeaderboardTable } from "./LeaderboardTable.tsx";

type LeaderboardPanelProps = {
  open: boolean;
  loading: boolean;
  entries: LeaderboardEntry[];
  currentGameId: string | null;
  onClose: () => void;
};

export function LeaderboardPanel(
  { open, loading, entries, currentGameId, onClose }: LeaderboardPanelProps,
) {
  return (
    <>
      {/* Backdrop */}
      <div
        class={`fixed inset-0 bg-shadow/60 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        class={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-dungeon-surface border-l border-dungeon-border z-40 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-5 py-4 border-b border-dungeon-border">
          <h2 class="font-heading text-xl text-torch-amber">
            The Gravekeeper's Ledger
          </h2>
          <button
            type="button"
            class="text-parchment-dark hover:text-parchment transition-colors duration-200 text-xl leading-none"
            onClick={onClose}
            aria-label="Close leaderboard"
          >
            &#x2715;
          </button>
        </div>

        {/* Scrollable content */}
        <div class="overflow-y-auto h-[calc(100%-3.5rem)] px-5 py-4">
          {getLeaderboardStatusMessage(loading, entries.length) !== null
            ? (
              <p class="text-parchment-dark font-body text-sm text-center mt-8">
                {getLeaderboardStatusMessage(loading, entries.length)}
              </p>
            )
            : (
              <LeaderboardTable
                entries={entries}
                highlightGameId={currentGameId}
              />
            )}
        </div>
      </div>
    </>
  );
}
