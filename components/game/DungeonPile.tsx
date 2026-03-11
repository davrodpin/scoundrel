import { useState } from "preact/hooks";
import { cardBackPath } from "@scoundrel/game";

type DungeonPileProps = {
  count: number;
  interactive?: boolean;
  onClick?: () => void;
};

export function DungeonPile(
  { count, interactive = false, onClick }: DungeonPileProps,
) {
  const [loaded, setLoaded] = useState(false);
  const cursorClass = interactive ? "cursor-pointer hover:scale-105" : "";

  return (
    <div class="flex flex-col items-center gap-1">
      <div
        class={`relative w-[clamp(140px,28vw,230px)] transition-transform duration-200 ${cursorClass}`}
        onClick={interactive ? onClick : undefined}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        {count > 0
          ? (
            <>
              <div class="absolute top-1 left-1 w-full h-full rounded-sm border border-dungeon-border bg-dungeon-surface" />
              <img
                src={cardBackPath()}
                alt="Dungeon pile"
                draggable={false}
                onLoad={() => setLoaded(true)}
                class={`relative w-full rounded-sm border border-dungeon-border transition-opacity duration-200 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </>
          )
          : (
            <div class="w-[clamp(140px,28vw,230px)] aspect-[5/7] rounded-sm border border-dungeon-border bg-dungeon-surface flex items-center justify-center">
              <span class="text-parchment-dark text-xs">Empty</span>
            </div>
          )}
      </div>
      <span class="text-parchment-dark text-sm font-body">
        Dungeon ({count})
      </span>
    </div>
  );
}
