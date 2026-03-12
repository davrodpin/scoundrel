import { useState } from "preact/hooks";
import { cardBackPath } from "@scoundrel/game";
import { deckLayerOffsets, DUNGEON_MAX_CARDS } from "./deck_volume_utils.ts";

type DiscardPileProps = {
  count: number;
};

export function DiscardPile({ count }: DiscardPileProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div class="flex flex-col items-center gap-1">
      <div class="relative w-[clamp(140px,28vw,230px)]">
        {count > 0
          ? (
            <>
              {deckLayerOffsets(count, DUNGEON_MAX_CARDS).map((offset) => (
                <div
                  key={offset}
                  class="absolute w-full h-full rounded-sm border border-dungeon-border bg-dungeon-surface"
                  style={`top: ${offset * 2}px; left: ${offset * 2}px;`}
                />
              ))}
              <img
                src={cardBackPath()}
                alt="Discard pile"
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
