type GameOverOverlayProps = {
  reason: "dead" | "dungeon_cleared";
  score: number;
  onNewGame: () => void;
  errorMessage?: string | null;
  loading?: boolean;
  rank?: number | null;
  topPercent?: number | null;
  isInTopN?: boolean;
  gameId?: string;
};

export function GameOverOverlay(
  {
    reason,
    score,
    onNewGame,
    errorMessage,
    loading,
    rank,
    topPercent,
    isInTopN,
    gameId,
  }: GameOverOverlayProps,
) {
  const title = reason === "dead" ? "You Have Fallen" : "Dungeon Cleared";
  const subtitle = reason === "dead"
    ? "The dungeon claims another soul..."
    : "You survived the dungeon!";

  return (
    <div class="fixed inset-0 bg-shadow/90 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-4 md:p-8 max-w-md w-full mx-4 text-center">
        <h2 class="font-heading text-2xl md:text-3xl text-parchment mb-2">
          {title}
        </h2>
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
          {isInTopN && rank != null
            ? (
              <div class="text-parchment-dark text-sm font-body mt-2">
                Leaderboard Rank #{rank}
              </div>
            )
            : !isInTopN && topPercent != null
            ? (
              <div class="text-parchment-dark text-sm font-body mt-2">
                Top {topPercent}%
              </div>
            )
            : null}
        </div>

        {errorMessage && (
          <p class="text-blood-bright font-body text-sm mb-3">
            {errorMessage}
          </p>
        )}
        <div class="flex flex-col gap-3 items-center">
          <button
            type="button"
            class="px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onNewGame}
            disabled={loading}
          >
            {loading ? "Starting..." : "New Game"}
          </button>
          <div class="flex gap-3">
            {gameId && (
              <a
                href={`/leaderboard?gameId=${gameId}`}
                class={`px-6 py-3 rounded-sm border border-dungeon-border text-parchment-dark hover:text-parchment hover:border-parchment-dark font-body transition-colors duration-200 ${
                  loading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Show Leaderboard
              </a>
            )}
            <a
              href="/play"
              class={`px-6 py-3 rounded-sm border border-dungeon-border text-parchment-dark hover:text-parchment hover:border-parchment-dark font-body transition-colors duration-200 ${
                loading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Back to Main
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
