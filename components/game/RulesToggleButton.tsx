type RulesToggleButtonProps = {
  onClick: () => void;
};

export function RulesToggleButton({ onClick }: RulesToggleButtonProps) {
  return (
    <button
      type="button"
      class="fixed top-4 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber font-heading text-lg transition-colors duration-200"
      onClick={onClick}
      aria-label="Game rules"
    >
      ?
    </button>
  );
}
