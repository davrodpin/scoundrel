import type { Card } from "@scoundrel/engine";
import { CardImage } from "./CardImage.tsx";
import {
  isPendingAvoidRoom,
  isPendingOnCard,
  type PendingAction,
  pendingCardAnimation,
} from "../../islands/pending_action.ts";

type RoomAreaProps = {
  cards: readonly Card[];
  onCardClick?: (index: number) => void;
  interactive: boolean;
  selectedIndex?: number | null;
  focusedIndex?: number | null;
  pendingAction?: PendingAction;
};

export function RoomArea(
  {
    cards,
    onCardClick,
    interactive,
    selectedIndex,
    focusedIndex,
    pendingAction,
  }: RoomAreaProps,
) {
  const slots = Array.from({ length: 4 }, (_, i) => cards[i] ?? null);
  const avoidPending = pendingAction
    ? isPendingAvoidRoom(pendingAction)
    : false;

  return (
    <div class="grid grid-cols-2 gap-2 justify-items-center md:flex md:justify-center md:gap-3">
      {slots.map((card, i) => {
        if (!card) {
          return (
            <div
              key={`empty-${i}`}
              class="w-[clamp(90px,30vw,120px)] md:w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dungeon-border bg-dungeon-surface/30"
            />
          );
        }

        const isSelected = selectedIndex === i;
        const isFocused = focusedIndex === i && !isSelected;
        const isHighlighted = interactive && !isSelected && !isFocused;

        let animClass: string | undefined;
        if (pendingAction && isPendingOnCard(pendingAction, i)) {
          animClass = pendingCardAnimation(pendingAction) ?? undefined;
        } else if (avoidPending) {
          animClass = "animate-room-avoid";
        }

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
            animationClass={animClass}
          />
        );
      })}
    </div>
  );
}
