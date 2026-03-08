import type { Card } from "@scoundrel/engine";

type FightOverlayProps = {
  card: Card;
  canUseWeapon: boolean;
  weaponDamage: number;
  barehandedDamage: number;
  onChoose: (fightWith: "weapon" | "barehanded") => void;
  onCancel: () => void;
};

export function FightOverlay(
  { canUseWeapon, weaponDamage, barehandedDamage, onChoose, onCancel }:
    FightOverlayProps,
) {
  const btnBase =
    "pointer-events-auto px-2 py-1.5 rounded-sm border font-body text-[11px] leading-tight w-full transition-colors duration-200";

  return (
    <div class="absolute inset-0 bg-shadow/85 z-20 flex flex-col items-center justify-center gap-2 p-2 rounded-sm">
      {canUseWeapon && (
        <button
          type="button"
          class={`${btnBase} bg-weapon-steel text-parchment border-weapon-steel hover:border-torch-amber`}
          onClick={() => onChoose("weapon")}
        >
          Weapon
          <span class="block text-[10px] text-parchment-dark">
            {weaponDamage > 0 ? `${weaponDamage} dmg` : "No dmg"}
          </span>
        </button>
      )}

      <button
        type="button"
        class={`${btnBase} bg-blood-red text-parchment border-blood-red hover:border-blood-bright`}
        onClick={() => onChoose("barehanded")}
      >
        Barehanded
        <span class="block text-[10px] text-parchment-dark">
          {barehandedDamage} dmg
        </span>
      </button>

      <button
        type="button"
        class={`${btnBase} bg-transparent text-parchment-dark border-dungeon-border hover:border-parchment-dark text-[10px]`}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
