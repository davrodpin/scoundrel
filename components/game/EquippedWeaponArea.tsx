import { useState } from "preact/hooks";
import type { EquippedWeapon } from "@scoundrel/engine";
import { cardImagePath } from "@scoundrel/game";

type EquippedWeaponAreaProps = {
  weapon: EquippedWeapon | null;
};

export function EquippedWeaponArea({ weapon }: EquippedWeaponAreaProps) {
  const [weaponLoaded, setWeaponLoaded] = useState(false);
  const [lastSlainLoaded, setLastSlainLoaded] = useState(false);

  if (!weapon) {
    return (
      <div class="flex justify-center mt-6">
        <div class="flex flex-col items-center gap-1">
          <div class="w-[clamp(140px,28vw,230px)] aspect-[5/7] rounded-sm border border-dungeon-border bg-dungeon-surface/30 flex items-center justify-center">
            <span class="text-parchment-dark text-xs">No weapon</span>
          </div>
          <span class="text-weapon-steel text-sm font-body">Weapon</span>
        </div>
      </div>
    );
  }

  const slain = weapon.slainMonsters;
  const lastSlain = slain.length > 0 ? slain[slain.length - 1] : null;

  return (
    <div class="flex justify-center mt-6">
      <div class="flex flex-col items-center gap-1">
        <div class="flex items-start gap-3">
          <div class="w-[clamp(140px,28vw,230px)] aspect-[5/7] overflow-hidden rounded-sm border border-weapon-steel bg-dungeon-surface/30">
            <img
              src={cardImagePath(weapon.card)}
              alt={`Weapon: ${weapon.card.rank} of ${weapon.card.suit}`}
              draggable={false}
              onLoad={() => setWeaponLoaded(true)}
              class={`w-full h-full object-cover transition-opacity duration-200 ${
                weaponLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
          {lastSlain
            ? (
              <div class="w-[clamp(140px,28vw,230px)] aspect-[5/7] overflow-hidden rounded-sm border border-dungeon-border bg-dungeon-surface/30">
                <img
                  src={cardImagePath(lastSlain)}
                  alt={`Last slain: ${lastSlain.rank} of ${lastSlain.suit}`}
                  draggable={false}
                  onLoad={() => setLastSlainLoaded(true)}
                  class={`w-full h-full object-cover transition-opacity duration-200 ${
                    lastSlainLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            )
            : (
              <div class="w-[clamp(140px,28vw,230px)] aspect-[5/7] rounded-sm border border-dashed border-dungeon-border bg-dungeon-surface/20 flex items-center justify-center">
                <span class="text-parchment-dark text-xs">No kills yet</span>
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
