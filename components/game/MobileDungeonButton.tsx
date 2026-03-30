type MobileDungeonButtonProps = {
  isEmpty: boolean;
  interactive: boolean;
  onClick: () => void;
  pending: boolean;
  onFillRoom?: () => void;
  fillRoomInteractive?: boolean;
  fillRoomPending?: boolean;
};

export function MobileDungeonButton(
  {
    isEmpty,
    interactive,
    onClick,
    pending,
    onFillRoom,
    fillRoomInteractive = false,
    fillRoomPending = false,
  }: MobileDungeonButtonProps,
) {
  const drawPendingClass = pending ? "animate-dungeon-draw" : "";
  const fillPendingClass = fillRoomPending ? "animate-dungeon-draw" : "";

  if (isEmpty) {
    return (
      <div class="flex md:hidden justify-center my-2">
        <button
          type="button"
          disabled
          class="px-6 py-3 rounded-sm border font-body text-sm bg-dungeon-surface border-dungeon-border text-parchment-dark/50 cursor-not-allowed opacity-50"
        >
          Dungeon Empty
        </button>
      </div>
    );
  }

  return (
    <div class="flex md:hidden justify-center gap-2 my-2">
      <button
        type="button"
        onClick={interactive ? onClick : undefined}
        disabled={!interactive}
        class={`px-4 py-3 rounded-sm border font-body text-sm transition-colors duration-200 ${
          interactive
            ? "bg-dungeon-surface border-dungeon-border text-parchment hover:bg-dungeon-border cursor-pointer"
            : "bg-dungeon-surface border-dungeon-border text-parchment-dark opacity-50 cursor-not-allowed"
        } ${drawPendingClass}`}
      >
        Draw Card
      </button>
      <button
        type="button"
        onClick={fillRoomInteractive ? onFillRoom : undefined}
        disabled={!fillRoomInteractive}
        class={`px-4 py-3 rounded-sm border font-body text-sm transition-colors duration-200 ${
          fillRoomInteractive
            ? "bg-dungeon-surface border-torch-amber text-torch-amber hover:bg-torch-amber hover:text-ink cursor-pointer"
            : "bg-dungeon-surface border-dungeon-border text-parchment-dark opacity-50 cursor-not-allowed"
        } ${fillPendingClass}`}
      >
        Fill Room
      </button>
    </div>
  );
}
