import type { Card, EquippedWeapon } from "@scoundrel/engine";
import { CardImage } from "./CardImage.tsx";
import type { DeckInfo } from "@scoundrel/game";

type EquippedWeaponProps = {
  weapon: EquippedWeapon | null;
  deck?: DeckInfo;
};

type LastSlainProps = {
  card: Card | null;
  deck?: DeckInfo;
};

export function EquippedWeaponCard({ weapon, deck }: EquippedWeaponProps) {
  if (!weapon) {
    return (
      <div class="w-[clamp(70px,22vw,100px)] md:w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dungeon-border bg-dungeon-surface/30 flex items-center justify-center">
        <span class="text-parchment-dark text-xs">No weapon</span>
      </div>
    );
  }

  return <CardImage card={weapon.card} deck={deck} />;
}

export function LastSlainCard({ card, deck }: LastSlainProps) {
  if (!card) {
    return (
      <div class="w-[clamp(70px,22vw,100px)] md:w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dashed border-dungeon-border bg-dungeon-surface/20 flex items-center justify-center">
        <span class="text-parchment-dark text-xs">No kills yet</span>
      </div>
    );
  }

  return <CardImage card={card} deck={deck} />;
}
