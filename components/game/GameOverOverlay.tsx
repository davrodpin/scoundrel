import type { LeaderboardEntry } from "@scoundrel/game-service";

type GameOverOverlayProps = {
  reason: "dead" | "dungeon_cleared";
  score: number;
  onNewGame: () => void;
  leaderboardEntries: LeaderboardEntry[];
  currentGameId: string;
  errorMessage?: string | null;
  loading?: boolean;
};

export function GameOverOverlay(
  {
    reason,
    score,
    onNewGame,
    leaderboardEntries,
    currentGameId,
    errorMessage,
    loading,
  }: GameOverOverlayProps,
) {
  const title = reason === "dead" ? "You Have Fallen" : "Dungeon Cleared";
  const subtitle = reason === "dead"
    ? "The dungeon claims another soul..."
    : "You survived the dungeon!";

  const top10 = leaderboardEntries.slice(0, 10);

  return (
    <div class="fixed inset-0 bg-shadow/90 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-8 max-w-md w-full mx-4 text-center">
        <h2 class="font-heading text-3xl text-parchment mb-2">{title}</h2>
        <p class="text-parchment-dark font-body mb-6">{subtitle}</p>

        <div class="mb-6">
          <div class="text-parchment-dark text-sm font-body mb-1">Score</div>
          <div
            class={`font-heading text-5xl ${
              score >= 0 ? "text-torch-glow" : "text-blood-bright"
            }`}
          >
            {score}
          </div>
        </div>

        {top10.length > 0 && (
          <div class="mb-6 text-left">
            <h3 class="font-heading text-torch-amber text-sm mb-2 text-center">
              Hall of Fame
            </h3>
            <table class="w-full font-body text-sm">
              <thead>
                <tr class="text-parchment-dark border-b border-dungeon-border">
                  <th class="text-left py-1 w-6">#</th>
                  <th class="text-left py-1">Adventurer</th>
                  <th class="text-right py-1">Score</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((entry, i) => {
                  const isCurrentGame = entry.gameId === currentGameId;
                  return (
                    <tr
                      key={entry.gameId}
                      class={`border-b border-dungeon-border/30 ${
                        isCurrentGame ? "bg-torch-amber/10" : ""
                      }`}
                    >
                      <td class="py-1 text-parchment-dark">{i + 1}</td>
                      <td
                        class={`py-1 truncate max-w-[160px] ${
                          isCurrentGame ? "text-torch-glow" : "text-parchment"
                        }`}
                      >
                        {isCurrentGame
                          ? `\u25b6 ${entry.playerName}`
                          : entry.playerName}
                      </td>
                      <td
                        class={`py-1 text-right font-heading ${
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
          </div>
        )}

        {errorMessage && (
          <p class="text-blood-bright font-body text-sm mb-3">
            {errorMessage}
          </p>
        )}
        <button
          type="button"
          class="px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onNewGame}
          disabled={loading}
        >
          {loading ? "Starting..." : "New Game"}
        </button>
      </div>
    </div>
  );
}
