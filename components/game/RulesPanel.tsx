import HowToPlay from "../../islands/HowToPlay.tsx";

type RulesPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function RulesPanel({ open, onClose }: RulesPanelProps) {
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
        class={`fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-dungeon-surface border-l border-dungeon-border z-40 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-5 py-4 border-b border-dungeon-border">
          <h2 class="font-heading text-xl text-torch-amber">Rules Reference</h2>
          <button
            type="button"
            class="text-parchment-dark hover:text-parchment transition-colors duration-200 text-xl leading-none"
            onClick={onClose}
            aria-label="Close rules"
          >
            &#x2715;
          </button>
        </div>

        {/* Scrollable content */}
        <div class="overflow-y-auto h-[calc(100%-3.5rem)]">
          <HowToPlay embedded />
        </div>
      </div>
    </>
  );
}
