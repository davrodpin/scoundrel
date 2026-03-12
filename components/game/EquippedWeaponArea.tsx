import { useState } from "preact/hooks";
import type { Card, EquippedWeapon } from "@scoundrel/engine";
import { cardImagePath } from "@scoundrel/game";

type EquippedWeaponProps = {
  weapon: EquippedWeapon | null;
};

type LastSlainProps = {
  card: Card | null;
};

export function EquippedWeaponCard({ weapon }: EquippedWeaponProps) {
  const [loaded, setLoaded] = useState(false);

  if (!weapon) {
    return (
      <div class="w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dungeon-border bg-dungeon-surface/30 flex items-center justify-center">
        <span class="text-parchment-dark text-xs">No weapon</span>
      </div>
    );
  }

  return (
    <div class="w-[clamp(140px,28vw,230px)] aspect-[460/686] overflow-hidden rounded-sm border border-weapon-steel bg-dungeon-surface/30">
      <img
        src={cardImagePath(weapon.card)}
        alt={`Weapon: ${weapon.card.rank} of ${weapon.card.suit}`}
        draggable={false}
        onLoad={() => setLoaded(true)}
        class={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export function LastSlainCard({ card }: LastSlainProps) {
  const [loaded, setLoaded] = useState(false);

  if (!card) {
    return (
      <div class="w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dashed border-dungeon-border bg-dungeon-surface/20 flex items-center justify-center">
        <span class="text-parchment-dark text-xs">No kills yet</span>
      </div>
    );
  }

  return (
    <div class="w-[clamp(140px,28vw,230px)] aspect-[460/686] overflow-hidden rounded-sm border border-dungeon-border bg-dungeon-surface/30">
      <img
        src={cardImagePath(card)}
        alt={`Last slain: ${card.rank} of ${card.suit}`}
        draggable={false}
        onLoad={() => setLoaded(true)}
        class={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
