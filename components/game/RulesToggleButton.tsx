type RulesToggleButtonProps = {
  onClick: () => void;
};

export function RulesToggleButton({ onClick }: RulesToggleButtonProps) {
  return (
    <div class="fixed top-2 right-2 md:top-4 md:right-4 z-30 group">
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber font-heading text-lg transition-colors duration-200"
        onClick={onClick}
        aria-label="Game rules"
      >
        ?
      </button>
      <div class="pointer-events-none absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
        <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm whitespace-nowrap">
          Rules
        </div>
        <div class="absolute bottom-full right-3 border-4 border-transparent border-b-dungeon-border" />
      </div>
    </div>
  );
}
