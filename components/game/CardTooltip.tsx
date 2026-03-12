import type { ComponentChildren } from "preact";

type CardTooltipProps = {
  lines: string[];
  children: ComponentChildren;
};

export function CardTooltip({ lines, children }: CardTooltipProps) {
  if (lines.length === 0) return <>{children}</>;

  return (
    <div class="relative group">
      {children}
      <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
        <div class="bg-ink border border-torch-amber text-parchment text-xs font-body px-3 py-1.5 rounded-sm whitespace-nowrap text-center">
          {lines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-torch-amber" />
      </div>
    </div>
  );
}
