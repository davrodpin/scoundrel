import { useState } from "preact/hooks";
import { cardBackPath } from "@scoundrel/game";
import { deckLayerOffsets, DUNGEON_MAX_CARDS } from "./deck_volume_utils.ts";

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
        class={`relative w-[clamp(140px,28vw,230px)] mr-3 mb-3 transition-transform duration-200 ${cursorClass}`}
        onClick={interactive ? onClick : undefined}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        {count > 0
          ? (
            <>
              {deckLayerOffsets(count, DUNGEON_MAX_CARDS).map((offset) => (
                <div
                  key={offset}
                  class="absolute w-full h-full rounded-sm border border-dungeon-border bg-white"
                  style={`top: ${offset * 2}px; left: ${
                    offset * 2
                  }px; transform: rotate(${
                    offset * 1.5
                  }deg); transform-origin: center center;`}
                />
              ))}
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
            <div class="w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dungeon-border bg-dungeon-surface flex items-center justify-center">
              <span class="text-parchment-dark text-xs">Empty</span>
            </div>
          )}
      </div>
    </div>
  );
}
