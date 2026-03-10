import { useSignal } from "@preact/signals";
import type { Card } from "@scoundrel/engine";
import SvgCard from "../../components/how-to-play/SvgCard.tsx";
import { computeCombatDamage } from "./demo_logic.ts";

const MONSTER_OPTIONS: Card[] = [
  { suit: "spades", rank: 10 },
  { suit: "clubs", rank: 13 },
  { suit: "spades", rank: 6 },
];

const WEAPON: Card = { suit: "diamonds", rank: 7 };

export default function CombatDemo() {
  const health = useSignal(20);
  const monsterIdx = useSignal(0);
  const lastResult = useSignal<string | null>(null);
  const resolved = useSignal(false);

  const monster = MONSTER_OPTIONS[monsterIdx.value];

  function fightBarehanded() {
    const { damage } = computeCombatDamage(monster.rank, null);
    health.value = Math.max(0, health.value - damage);
    lastResult.value = `${monster.rank} damage (barehanded)`;
    resolved.value = true;
  }

  function fightWithWeapon() {
    const { damage } = computeCombatDamage(monster.rank, WEAPON.rank);
    health.value = Math.max(0, health.value - damage);
    lastResult.value =
      `${monster.rank} - ${WEAPON.rank} = ${damage} damage (weapon)`;
    resolved.value = true;
  }

  function nextMonster() {
    monsterIdx.value = (monsterIdx.value + 1) % MONSTER_OPTIONS.length;
    resolved.value = false;
    lastResult.value = null;
  }

  function reset() {
    health.value = 20;
    monsterIdx.value = 0;
    resolved.value = false;
    lastResult.value = null;
  }

  const hpPercent = (health.value / 20) * 100;
  const hpColor = health.value > 10
    ? "bg-potion-green"
    : health.value > 5
    ? "bg-torch-amber"
    : "bg-blood-bright";

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
            class={`h-full ${hpColor} transition-[width] duration-500`}
            style={`width: ${hpPercent}%`}
          />
        </div>
      </div>

      {/* Cards */}
      <div class="flex items-start gap-6 flex-wrap">
        {/* Monster */}
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs text-parchment-dark font-body uppercase tracking-wide">
            Monster
          </span>
          <SvgCard card={monster} dimmed={resolved.value} />
          <span class="text-xs text-blood-red font-body">
            Value: {monster.rank}
          </span>
        </div>

        {/* VS */}
        <div class="flex items-center self-center text-parchment-dark font-heading text-xl pt-4">
          vs
        </div>

        {/* Weapon */}
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs text-parchment-dark font-body uppercase tracking-wide">
            Equipped Weapon
          </span>
          <SvgCard card={WEAPON} />
          <span class="text-xs text-weapon-steel font-body">
            Value: {WEAPON.rank}
          </span>
        </div>
      </div>

      {/* Result */}
      {lastResult.value && (
        <div class="text-center py-2 px-4 bg-dungeon-bg border border-dungeon-border rounded-sm">
          <span class="text-torch-amber font-heading text-sm">
            {lastResult.value}
          </span>
        </div>
      )}

      {/* Actions */}
      <div class="flex flex-wrap gap-2">
        {!resolved.value
          ? (
            <>
              <button
                type="button"
                onClick={fightBarehanded}
                class="px-3 py-2 bg-dungeon-bg border border-blood-red text-blood-red font-body text-sm rounded-sm hover:bg-blood-red hover:text-parchment transition-colors"
              >
                Fight Barehanded ({monster.rank} dmg)
              </button>
              <button
                type="button"
                onClick={fightWithWeapon}
                class="px-3 py-2 bg-dungeon-bg border border-weapon-steel text-weapon-steel font-body text-sm rounded-sm hover:bg-weapon-steel hover:text-parchment transition-colors"
              >
                Fight with Weapon ({Math.max(0, monster.rank - WEAPON.rank)}
                {" "}
                dmg)
              </button>
            </>
          )
          : (
            <button
              type="button"
              onClick={nextMonster}
              class="px-3 py-2 bg-dungeon-bg border border-torch-amber text-torch-amber font-body text-sm rounded-sm hover:bg-torch-amber hover:text-ink transition-colors"
            >
              Next Monster
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
