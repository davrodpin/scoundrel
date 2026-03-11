import { cardBackPath } from "@scoundrel/game";

type DiscardPileProps = {
  count: number;
};

export function DiscardPile({ count }: DiscardPileProps) {
  return (
    <div class="flex flex-col items-center gap-1">
      <div class="relative w-[clamp(140px,28vw,230px)]">
        {count > 0
          ? (
            <>
              <div class="absolute top-1 left-1 w-full h-full rounded-sm border border-dungeon-border bg-dungeon-surface" />
              <img
                src={cardBackPath()}
                alt="Discard pile"
                draggable={false}
                class="relative w-full rounded-sm border border-dungeon-border"
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
        Discard ({count})
      </span>
    </div>
  );
}
