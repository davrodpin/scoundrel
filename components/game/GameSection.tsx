import type { ComponentChildren } from "preact";

type GameSectionProps = {
  label: string;
  children: ComponentChildren;
};

export function GameSection({ label, children }: GameSectionProps) {
  return (
    <div class="bg-dungeon-surface border border-dungeon-border rounded-sm px-3 py-2 md:px-6 md:py-5 flex flex-col items-center gap-2 overflow-hidden h-full">
      <span class="text-parchment-dark/70 text-[10px] md:text-xs font-body uppercase tracking-[0.2em]">
        {label}
      </span>
      {children}
    </div>
  );
}
