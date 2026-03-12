import type { Card, EquippedWeapon } from "@scoundrel/engine";
import { CardImage } from "./CardImage.tsx";
import { CardTooltip } from "./CardTooltip.tsx";
import { computeWeaponCardTooltip } from "./tooltip_utils.ts";

type EquippedWeaponProps = {
  weapon: EquippedWeapon | null;
};

type LastSlainProps = {
  card: Card | null;
};

export function EquippedWeaponCard({ weapon }: EquippedWeaponProps) {
  if (!weapon) {
    return (
      <div class="w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dungeon-border bg-dungeon-surface/30 flex items-center justify-center">
        <span class="text-parchment-dark text-xs">No weapon</span>
      </div>
    );
  }

  return (
    <CardTooltip lines={computeWeaponCardTooltip(weapon)}>
      <CardImage card={weapon.card} />
    </CardTooltip>
  );
}

export function LastSlainCard({ card }: LastSlainProps) {
  if (!card) {
    return (
      <div class="w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dashed border-dungeon-border bg-dungeon-surface/20 flex items-center justify-center">
        <span class="text-parchment-dark text-xs">No kills yet</span>
      </div>
    );
  }

  return <CardImage card={card} />;
}
