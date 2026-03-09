import type { LeaderboardEntry } from "@scoundrel/game-service";

type LeaderboardPanelProps = {
  open: boolean;
  entries: LeaderboardEntry[];
  currentGameId: string | null;
  onClose: () => void;
};

export function LeaderboardPanel(
  { open, entries, currentGameId, onClose }: LeaderboardPanelProps,
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
          <h2 class="font-heading text-xl text-torch-amber">Hall of Fame</h2>
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
          {entries.length === 0
            ? (
              <p class="text-parchment-dark font-body text-sm text-center mt-8">
                No completed games yet. Be the first to conquer the dungeon.
              </p>
            )
            : (
              <table class="w-full font-body text-sm">
                <thead>
                  <tr class="text-parchment-dark border-b border-dungeon-border">
                    <th class="text-left py-2 w-8">#</th>
                    <th class="text-left py-2">Adventurer</th>
                    <th class="text-right py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const isCurrentGame = entry.gameId === currentGameId;
                    return (
                      <tr
                        key={entry.gameId}
                        class={`border-b border-dungeon-border/40 ${
                          isCurrentGame
                            ? "bg-torch-amber/10 text-torch-glow"
                            : "text-parchment"
                        }`}
                      >
                        <td class="py-2 text-parchment-dark">{i + 1}</td>
                        <td class="py-2 truncate max-w-[180px]">
                          {isCurrentGame
                            ? `\u25b6 ${entry.playerName}`
                            : entry.playerName}
                        </td>
                        <td
                          class={`py-2 text-right font-heading ${
                            entry.score >= 0
                              ? "text-torch-amber"
                              : "text-blood-bright"
                          }`}
                        >
                          {entry.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </>
  );
}
