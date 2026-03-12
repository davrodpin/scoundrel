import type { Card } from "@scoundrel/engine";
import { CardImage } from "./CardImage.tsx";

type RoomAreaProps = {
  cards: readonly Card[];
  onCardClick?: (index: number) => void;
  interactive: boolean;
  selectedIndex?: number | null;
  focusedIndex?: number | null;
};

export function RoomArea(
  { cards, onCardClick, interactive, selectedIndex, focusedIndex }:
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
              class="w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dungeon-border bg-dungeon-surface/30"
            />
          );
        }

        const isSelected = selectedIndex === i;
        const isFocused = focusedIndex === i && !isSelected;
        const isHighlighted = interactive && !isSelected && !isFocused;

        return (
          <CardImage
            key={`${card.suit}-${card.rank}-${i}`}
            card={card}
            onClick={interactive && onCardClick
              ? () => onCardClick(i)
              : undefined}
            selected={isSelected}
            focused={isFocused}
            highlighted={isHighlighted}
          />
        );
      })}
    </div>
  );
}
