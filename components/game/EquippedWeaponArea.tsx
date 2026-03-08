import type { EquippedWeapon } from "@scoundrel/engine";
import { cardImagePath } from "@scoundrel/game";

type EquippedWeaponAreaProps = {
  weapon: EquippedWeapon | null;
};

export function EquippedWeaponArea({ weapon }: EquippedWeaponAreaProps) {
  if (!weapon) {
    return (
      <div class="flex justify-center mt-6">
        <div class="flex flex-col items-center gap-1">
          <div class="w-[clamp(120px,25vw,200px)] aspect-[5/7] rounded-sm border border-dungeon-border bg-dungeon-surface/30 flex items-center justify-center">
            <span class="text-parchment-dark text-xs">No weapon</span>
          </div>
          <span class="text-weapon-steel text-sm font-body">Weapon</span>
        </div>
      </div>
    );
  }

  const slain = weapon.slainMonsters;
  // Weapon top 1/3 always visible; slain monsters start at 33% down.
  // Card aspect is 5:7, so 1/3 height = (7/5) * (1/3) * 100% ≈ 46.67% of width.
  const weaponRevealPct = 46.67;

  return (
    <div class="flex justify-center mt-6">
      <div class="flex flex-col items-center gap-1">
        <div
          class="relative w-[clamp(120px,25vw,200px)]"
          style={slain.length > 0
            ? `padding-bottom: ${weaponRevealPct}%`
            : undefined}
        >
          <img
            src={cardImagePath(weapon.card)}
            alt={`Weapon: ${weapon.card.rank} of ${weapon.card.suit}`}
            class="w-full h-auto rounded-sm border border-weapon-steel"
          />
          {slain.length > 0 && (
            <div
              class="absolute left-0 w-full"
              style={`top: ${weaponRevealPct}%`}
            >
              <div class="relative w-full">
                {slain.map((monster, i) => {
                  const isLast = i === slain.length - 1;
                  return (
                    <img
                      key={`slain-${monster.suit}-${monster.rank}-${i}`}
                      src={cardImagePath(monster)}
                      alt={`Slain: ${monster.rank} of ${monster.suit}`}
                      class={`w-full h-auto rounded-sm border border-dungeon-border ${
                        isLast ? "relative" : "absolute top-0 left-0"
                      }`}
                      style={isLast
                        ? undefined
                        : `transform: translate(${i * 3}px, ${i * 3}px)`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <span class="text-weapon-steel text-sm font-body">
          Weapon{slain.length > 0 ? ` (${slain.length} slain)` : ""}
        </span>
      </div>
    </div>
  );
}
