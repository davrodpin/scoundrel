import type { GamePhase } from "@scoundrel/engine";

type ActionBarProps = {
  phase: GamePhase;
  cardsChosen?: number;
};

export function ActionBar({ phase, cardsChosen }: ActionBarProps) {
  return (
    <div class="flex justify-center gap-3 mt-4 mb-2">
      {phase.kind === "choosing" && (
        <div class="text-parchment font-body text-sm self-center">
          Choose a card ({cardsChosen ?? 0} of 3 chosen)
        </div>
      )}
      {phase.kind === "game_over" && (
        <div class="text-parchment-dark font-body text-sm self-center">
          Game Over
        </div>
      )}
    </div>
  );
}
