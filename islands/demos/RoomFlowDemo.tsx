import { useSignal } from "@preact/signals";
import type { Card } from "@scoundrel/engine";
import SvgCard from "../../components/how-to-play/SvgCard.tsx";

const ROOM_CARDS: Card[] = [
  { suit: "clubs", rank: 8 },
  { suit: "diamonds", rank: 6 },
  { suit: "hearts", rank: 4 },
  { suit: "spades", rank: 11 },
];

export default function RoomFlowDemo() {
  const chosen = useSignal<number[]>([]);

  const chosenCount = chosen.value.length;
  const done = chosenCount >= 3;

  // The last unchosen card index (the one that stays)
  const remainingIdx = done
    ? ROOM_CARDS.findIndex((_, i) => !chosen.value.includes(i))
    : -1;

  function pick(idx: number) {
    if (done || chosen.value.includes(idx)) return;
    chosen.value = [...chosen.value, idx];
  }

  function reset() {
    chosen.value = [];
  }

  return (
    <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-4 space-y-4">
      {/* Counter */}
      <div class="flex items-center gap-2">
        <span class="font-body text-sm text-parchment-dark">Cards chosen:</span>
        <span class="font-heading text-torch-amber text-lg">
          {chosenCount} / 3
        </span>
        {done && (
          <span class="text-xs text-potion-green font-body ml-2">
            Turn complete!
          </span>
        )}
      </div>

      {/* Room cards */}
      <div class="flex gap-3 flex-wrap">
        {ROOM_CARDS.map((card, i) => {
          const isPicked = chosen.value.includes(i);
          const isRemaining = remainingIdx === i;

          return (
            <div key={i} class="flex flex-col items-center gap-1">
              <SvgCard
                card={card}
                dimmed={isPicked}
                highlighted={isRemaining}
                onClick={!isPicked && !done
                  ? () => pick(i)
                  : undefined}
              />
              <span class="text-xs font-body text-center">
                {isPicked
                  ? <span class="text-parchment-dark">Chosen</span>
                  : isRemaining
                  ? <span class="text-torch-amber">Stays next room</span>
                  : <span class="text-parchment-dark">Click to choose</span>}
              </span>
            </div>
          );
        })}
      </div>

      {done && (
        <div class="py-2 px-4 bg-dungeon-bg border border-dungeon-border rounded-sm">
          <span class="font-body text-sm text-parchment">
            You picked 3 cards. The highlighted card remains and becomes part of
            the next room.
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={reset}
        class="px-3 py-2 bg-dungeon-bg border border-dungeon-border text-parchment-dark font-body text-sm rounded-sm hover:border-parchment-dark transition-colors"
      >
        Reset
      </button>
    </div>
  );
}
