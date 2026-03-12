import type { ComponentChildren } from "preact";

type GameSectionProps = {
  label: string;
  children: ComponentChildren;
};

export function GameSection({ label, children }: GameSectionProps) {
  return (
    <div class="bg-dungeon-surface border border-dungeon-border rounded-sm px-4 py-3 flex flex-col gap-2">
      <span class="text-parchment-dark/70 text-xs font-body uppercase tracking-[0.2em]">
        {label}
      </span>
      {children}
    </div>
  );
}
