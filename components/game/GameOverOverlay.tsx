type GameOverOverlayProps = {
  reason: "dead" | "dungeon_cleared";
  score: number;
  onNewGame: () => void;
};

export function GameOverOverlay(
  { reason, score, onNewGame }: GameOverOverlayProps,
) {
  const title = reason === "dead" ? "You Have Fallen" : "Dungeon Cleared";
  const subtitle = reason === "dead"
    ? "The dungeon claims another soul..."
    : "You survived the dungeon!";

  return (
    <div class="fixed inset-0 bg-shadow/90 flex items-center justify-center z-50">
      <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-8 max-w-sm w-full mx-4 text-center">
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

        <button
          type="button"
          class="px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body transition-colors duration-200"
          onClick={onNewGame}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
