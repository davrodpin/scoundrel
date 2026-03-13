type MobileDungeonButtonProps = {
  isEmpty: boolean;
  interactive: boolean;
  onClick: () => void;
  pending: boolean;
};

export function MobileDungeonButton(
  { isEmpty, interactive, onClick, pending }: MobileDungeonButtonProps,
) {
  const pendingClass = pending ? "animate-dungeon-draw" : "";

  return (
    <div class={`flex md:hidden justify-center my-2 ${pendingClass}`}>
      <button
        type="button"
        onClick={interactive ? onClick : undefined}
        disabled={!interactive}
        class={`px-6 py-3 rounded-sm border font-body text-sm transition-colors duration-200 ${
          isEmpty
            ? "bg-dungeon-surface border-dungeon-border text-parchment-dark/50 cursor-not-allowed opacity-50"
            : interactive
            ? "bg-dungeon-surface border-torch-amber text-parchment hover:bg-dungeon-border cursor-pointer"
            : "bg-dungeon-surface border-dungeon-border text-parchment-dark opacity-50 cursor-not-allowed"
        }`}
      >
        {isEmpty ? "Dungeon Empty" : "Draw from Dungeon"}
      </button>
    </div>
  );
}
