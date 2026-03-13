import type { EquippedWeapon } from "@scoundrel/engine";
import { cardImagePath } from "@scoundrel/game";

type MobileWeaponBarProps = {
  weapon: EquippedWeapon | null;
};

export function MobileWeaponBar({ weapon }: MobileWeaponBarProps) {
  const lastSlain = weapon?.slainMonsters.at(-1) ?? null;

  return (
    <div class="flex md:hidden items-center gap-3 px-3 py-2 bg-dungeon-surface border border-dungeon-border rounded-sm w-full">
      {/* Weapon */}
      <div class="flex items-center gap-2 flex-1">
        <span class="text-parchment-dark/70 text-[10px] font-body uppercase tracking-[0.2em]">
          Weapon
        </span>
        {weapon
          ? (
            <img
              src={cardImagePath(weapon.card)}
              alt={`${weapon.card.rank} of ${weapon.card.suit}`}
              class="w-8 h-auto rounded-sm border border-dungeon-border"
            />
          )
          : (
            <span class="text-parchment-dark text-xs font-body">
              No weapon
            </span>
          )}
      </div>

      {/* Divider */}
      <div class="w-px h-8 bg-dungeon-border" />

      {/* Last slain */}
      <div class="flex items-center gap-2 flex-1">
        <span class="text-parchment-dark/70 text-[10px] font-body uppercase tracking-[0.2em]">
          Last Slain
        </span>
        {lastSlain
          ? (
            <img
              src={cardImagePath(lastSlain)}
              alt={`${lastSlain.rank} of ${lastSlain.suit}`}
              class="w-8 h-auto rounded-sm border border-dungeon-border"
            />
          )
          : <span class="text-parchment-dark text-xs font-body">No kills</span>}
      </div>
    </div>
  );
}
