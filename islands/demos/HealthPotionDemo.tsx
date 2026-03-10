import { useSignal } from "@preact/signals";
import type { Card } from "@scoundrel/engine";
import SvgCard from "../../components/how-to-play/SvgCard.tsx";
import { applyPotion } from "./demo_logic.ts";

const POTION_1: Card = { suit: "hearts", rank: 7 };
const POTION_2: Card = { suit: "hearts", rank: 3 };
const STARTING_HEALTH = 14;

export default function HealthPotionDemo() {
  const health = useSignal(STARTING_HEALTH);
  const potionUsed = useSignal(false);
  const usedIdx = useSignal<number | null>(null);
  const message = useSignal<string | null>(null);

  function usePotion(potion: Card, idx: number) {
    const result = applyPotion(health.value, potion.rank, potionUsed.value);
    if (result.applied) {
      const gained = result.newHealth - health.value;
      health.value = result.newHealth;
      potionUsed.value = true;
      usedIdx.value = idx;
      if (gained < potion.rank) {
        message.value =
          `Healed ${gained} HP (capped at 20). Would have healed ${potion.rank}.`;
      } else {
        message.value =
          `Healed ${gained} HP. Health is now ${result.newHealth}.`;
      }
    } else {
      message.value = `Rejected: ${result.reason}.`;
    }
  }

  function reset() {
    health.value = STARTING_HEALTH;
    potionUsed.value = false;
    usedIdx.value = null;
    message.value = null;
  }

  const hpPercent = (health.value / 20) * 100;

  return (
    <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-4 space-y-4">
      {/* Health bar */}
      <div>
        <div class="flex justify-between text-sm text-parchment-dark mb-1 font-body">
          <span>Health</span>
          <span class="font-bold text-parchment">{health.value} / 20</span>
        </div>
        <div class="h-3 bg-dungeon-bg rounded-sm overflow-hidden">
          <div
            class="h-full bg-potion-green transition-[width] duration-500"
            style={`width: ${hpPercent}%`}
          />
        </div>
      </div>

      {/* Potions */}
      <div class="flex gap-4 flex-wrap">
        {[POTION_1, POTION_2].map((potion, i) => {
          const isDismissed = usedIdx.value !== null && usedIdx.value !== i;
          const isUsed = usedIdx.value === i;

          return (
            <div key={i} class="flex flex-col items-center gap-1">
              <span class="text-xs text-parchment-dark font-body uppercase tracking-wide">
                Potion {i + 1}
              </span>
              <SvgCard
                card={potion}
                dimmed={isUsed || isDismissed}
                onClick={!isUsed && !isDismissed
                  ? () => usePotion(potion, i)
                  : undefined}
              />
              <span class="text-xs font-body text-potion-green">
                +{potion.rank} HP
              </span>
            </div>
          );
        })}
      </div>

      {/* Message */}
      {message.value && (
        <div class="py-2 px-4 bg-dungeon-bg border border-dungeon-border rounded-sm">
          <span
            class={`font-body text-sm ${
              message.value.startsWith("Rejected")
                ? "text-blood-bright"
                : "text-potion-green"
            }`}
          >
            {message.value}
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
