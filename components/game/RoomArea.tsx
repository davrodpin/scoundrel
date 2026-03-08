import type { Card } from "@scoundrel/engine";
import { CardImage } from "./CardImage.tsx";
import { CardTooltip } from "./CardTooltip.tsx";
import { FightOverlay } from "./FightOverlay.tsx";

type FightOverlayProps = {
  canUseWeapon: boolean;
  weaponDamage: number;
  barehandedDamage: number;
  onChoose: (fightWith: "weapon" | "barehanded") => void;
  onCancel: () => void;
};

type RoomAreaProps = {
  cards: readonly Card[];
  onCardClick?: (index: number) => void;
  interactive: boolean;
  tooltips?: string[][];
  fightIndex?: number | null;
  fightProps?: FightOverlayProps;
};

export function RoomArea(
  { cards, onCardClick, interactive, tooltips, fightIndex, fightProps }:
    RoomAreaProps,
) {
  const slots = Array.from({ length: 4 }, (_, i) => cards[i] ?? null);

  return (
    <div class="flex justify-center gap-3">
      {slots.map((card, i) => {
        if (!card) {
          return (
            <div
              key={`empty-${i}`}
              class="w-[clamp(120px,25vw,200px)] aspect-[5/7] rounded-sm border border-dungeon-border bg-dungeon-surface/30"
            />
          );
        }

        const hasFightOverlay = i === fightIndex && fightProps != null;

        const cardElement = (
          <CardImage
            key={`${card.suit}-${card.rank}-${i}`}
            card={card}
            onClick={!hasFightOverlay && interactive && onCardClick
              ? () => onCardClick(i)
              : undefined}
            highlighted={interactive && !hasFightOverlay}
          />
        );

        if (hasFightOverlay) {
          return (
            <div key={`${card.suit}-${card.rank}-${i}`} class="relative">
              {cardElement}
              <FightOverlay card={card} {...fightProps} />
            </div>
          );
        }

        const tooltipLines = interactive && tooltips?.[i];
        if (tooltipLines) {
          return (
            <CardTooltip
              key={`${card.suit}-${card.rank}-${i}`}
              lines={tooltipLines}
            >
              {cardElement}
            </CardTooltip>
          );
        }

        return cardElement;
      })}
    </div>
  );
}
