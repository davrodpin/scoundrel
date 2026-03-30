import { useState } from "preact/hooks";
import { cardBackPath } from "@scoundrel/game";
import { deckCardBackPath } from "@scoundrel/game";
import type { DeckInfo } from "@scoundrel/game";
import { deckLayerOffsets, DUNGEON_MAX_CARDS } from "./deck_volume_utils.ts";

type DungeonPileProps = {
  count: number;
  interactive?: boolean;
  onClick?: () => void;
  pending?: boolean;
  deck?: DeckInfo;
  onFillRoom?: () => void;
  fillRoomInteractive?: boolean;
  fillRoomPending?: boolean;
};

export function DungeonPile(
  {
    count,
    interactive = false,
    onClick,
    pending = false,
    deck,
    onFillRoom,
    fillRoomInteractive = false,
    fillRoomPending = false,
  }: DungeonPileProps,
) {
  const [loaded, setLoaded] = useState(false);
  const cursorClass = interactive ? "cursor-pointer hover:scale-105" : "";
  const pendingClass = pending ? "animate-dungeon-draw" : "";
  const backSrc = deck ? deckCardBackPath(deck) : cardBackPath();

  return (
    <div class="hidden md:flex flex-col items-center gap-1">
      <div
        class={`relative w-[clamp(140px,28vw,230px)] mr-3 mb-3 transition-transform duration-200 ${cursorClass} ${pendingClass}`}
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
                  class="absolute w-full h-full rounded-sm border border-stone-800 bg-amber-50"
                  style={`top: ${offset * 2}px; left: ${
                    offset * 2
                  }px; transform: rotate(${
                    offset * 1.5
                  }deg); transform-origin: center center;`}
                />
              ))}
              <img
                src={backSrc}
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
      {(interactive || fillRoomInteractive) && (
        <div class="flex flex-col gap-1 w-full mt-1">
          <button
            type="button"
            disabled={!interactive || pending}
            onClick={interactive ? onClick : undefined}
            class={`w-full px-2 py-1 text-xs rounded-sm border transition-colors duration-200 ${
              interactive && !pending
                ? "border-dungeon-border text-parchment hover:border-torch-amber hover:text-torch-glow bg-dungeon-surface"
                : "border-dungeon-border text-parchment-dark bg-dungeon-surface opacity-50 cursor-not-allowed"
            } ${pending ? "animate-dungeon-draw" : ""}`}
          >
            Draw Card (D)
          </button>
          <button
            type="button"
            disabled={!fillRoomInteractive || fillRoomPending}
            onClick={fillRoomInteractive ? onFillRoom : undefined}
            class={`w-full px-2 py-1 text-xs rounded-sm border transition-colors duration-200 ${
              fillRoomInteractive && !fillRoomPending
                ? "border-torch-amber text-torch-amber hover:bg-torch-amber hover:text-ink bg-dungeon-surface"
                : "border-dungeon-border text-parchment-dark bg-dungeon-surface opacity-50 cursor-not-allowed"
            } ${fillRoomPending ? "animate-dungeon-draw" : ""}`}
          >
            Fill Room (F)
          </button>
        </div>
      )}
    </div>
  );
}
