import { useSignal } from "@preact/signals";
import type { Card } from "@scoundrel/engine";
import SvgCard from "../../components/how-to-play/SvgCard.tsx";
import { canWeaponFight } from "./demo_logic.ts";

type Step = {
  label: string;
  monster: Card | null;
  lastSlainRank: number | null;
  blocked: boolean;
  message: string;
};

const WEAPON: Card = { suit: "diamonds", rank: 5 };

const STEPS: Step[] = [
  {
    label: "Fresh weapon equipped",
    monster: null,
    lastSlainRank: null,
    blocked: false,
    message: "The 5♦ weapon is freshly equipped. It can fight any monster.",
  },
  {
    label: "Slay Queen (12)",
    monster: { suit: "spades", rank: 12 },
    lastSlainRank: 12,
    blocked: false,
    message:
      "Weapon slays the Queen (12). Takes 7 damage (12-5=7). Now can only fight monsters ≤ 12.",
  },
  {
    label: "Slay 6",
    monster: { suit: "clubs", rank: 6 },
    lastSlainRank: 6,
    blocked: false,
    message:
      "6 ≤ 12, so weapon can still fight. Takes 1 damage (6-5=1). Now can only fight monsters ≤ 6.",
  },
  {
    label: "Slay 2",
    monster: { suit: "spades", rank: 2 },
    lastSlainRank: 2,
    blocked: false,
    message:
      "2 ≤ 6, weapon fights again. Takes 0 damage (2-5<0). Now can only fight monsters ≤ 2.",
  },
  {
    label: "King (13) appears — blocked!",
    monster: { suit: "clubs", rank: 13 },
    lastSlainRank: 2,
    blocked: true,
    message:
      "13 > 2, so weapon cannot be used. Must fight King barehanded — 13 damage!",
  },
];

export default function WeaponDegradationDemo() {
  const stepIdx = useSignal(0);

  const step = STEPS[stepIdx.value];
  const slainMonsters = STEPS.slice(1, stepIdx.value + 1)
    .filter((s) => !s.blocked && s.monster !== null)
    .map((s) => s.monster as Card);

  const canFight = step.monster !== null
    ? canWeaponFight(
      stepIdx.value > 0 ? STEPS[stepIdx.value - 1].lastSlainRank : null,
      step.monster.rank,
    )
    : true;

  function next() {
    if (stepIdx.value < STEPS.length - 1) stepIdx.value++;
  }

  function reset() {
    stepIdx.value = 0;
  }

  return (
    <div class="bg-dungeon-surface border border-dungeon-border rounded-sm p-4 space-y-4">
      {/* Step indicator */}
      <div class="flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            class={`h-1.5 flex-1 rounded-sm ${
              i <= stepIdx.value ? "bg-torch-amber" : "bg-dungeon-bg"
            }`}
          />
        ))}
      </div>

      {/* Cards area */}
      <div class="flex items-start gap-4 flex-wrap">
        {/* Weapon + slain stack */}
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs text-parchment-dark font-body uppercase tracking-wide">
            Weapon
          </span>
          <div
            class="relative"
            style={`padding-bottom: ${slainMonsters.length * 28}px`}
          >
            <SvgCard
              card={WEAPON}
              dimmed={step.blocked}
            />
            {slainMonsters.map((m, i) => (
              <div
                key={i}
                class="absolute left-0"
                style={`top: ${(i + 1) * 28}px`}
              >
                <SvgCard card={m} small />
              </div>
            ))}
          </div>
          {step.lastSlainRank !== null && !step.blocked && (
            <span class="text-xs text-parchment-dark font-body mt-1">
              Next: ≤ {step.lastSlainRank}
            </span>
          )}
        </div>

        {/* Arrow */}
        {step.monster !== null && (
          <>
            <div class="self-center text-parchment-dark font-body pt-4">
              {canFight ? "→" : "✗"}
            </div>

            {/* Current monster */}
            <div class="flex flex-col items-center gap-1">
              <span class="text-xs text-parchment-dark font-body uppercase tracking-wide">
                Monster
              </span>
              <SvgCard
                card={step.monster}
                dimmed={!canFight}
                highlighted={!canFight}
              />
              <span
                class={`text-xs font-body ${
                  canFight ? "text-blood-red" : "text-blood-bright"
                }`}
              >
                {canFight
                  ? `Value: ${step.monster.rank}`
                  : "Cannot use weapon!"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Message */}
      <div class="py-2 px-4 bg-dungeon-bg border border-dungeon-border rounded-sm">
        <span
          class={`font-body text-sm ${
            step.blocked ? "text-blood-bright" : "text-parchment"
          }`}
        >
          {step.message}
        </span>
      </div>

      {/* Controls */}
      <div class="flex gap-2">
        {stepIdx.value < STEPS.length - 1 && (
          <button
            type="button"
            onClick={next}
            class="px-3 py-2 bg-dungeon-bg border border-torch-amber text-torch-amber font-body text-sm rounded-sm hover:bg-torch-amber hover:text-ink transition-colors"
          >
            Next Step
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          class="px-3 py-2 bg-dungeon-bg border border-dungeon-border text-parchment-dark font-body text-sm rounded-sm hover:border-parchment-dark transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
