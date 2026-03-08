import type { GamePhase } from "@scoundrel/engine";

type ActionBarProps = {
  phase: GamePhase;
  lastRoomAvoided: boolean;
  onAvoidRoom: () => void;
  cardsChosen?: number;
};

export function ActionBar(
  {
    phase,
    lastRoomAvoided,
    onAvoidRoom,
    cardsChosen,
  }: ActionBarProps,
) {
  const btnBase =
    "px-4 py-2 rounded-sm border font-body text-sm transition-colors duration-200";
  const btnEnabled =
    `${btnBase} bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow`;
  const btnDisabled =
    `${btnBase} bg-dungeon-surface text-parchment-dark border-dungeon-border opacity-50 cursor-not-allowed`;

  const avoidEnabled = phase.kind === "room_ready" && !lastRoomAvoided;

  return (
    <div class="flex justify-center gap-3 mt-4 mb-2">
      <button
        type="button"
        class={avoidEnabled ? btnEnabled : btnDisabled}
        onClick={avoidEnabled ? onAvoidRoom : undefined}
        disabled={!avoidEnabled}
      >
        Avoid Room
      </button>
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
