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
    <div class="flex justify-center md:gap-3">
      {slots.map((card, i) => {
        const overlapClass = i > 0 ? "-ml-10 md:ml-0" : "";

        if (!card) {
          return (
            <div
              key={`empty-${i}`}
              class={`relative ${overlapClass}`}
              style={{ zIndex: (i + 1) * 10 }}
            >
              <div class="w-[clamp(70px,22vw,100px)] md:w-[clamp(140px,28vw,230px)] aspect-[460/686] rounded-sm border border-dungeon-border bg-dungeon-surface/30" />
            </div>
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
          <div
            key={`slot-${i}`}
            class={`relative ${overlapClass}`}
            style={{ zIndex: isSelected ? 50 : (i + 1) * 10 }}
          >
            <CardImage
              card={card}
              onClick={interactive && onCardClick
                ? () => onCardClick(i)
                : undefined}
              selected={isSelected}
              focused={isFocused}
              highlighted={isHighlighted}
              animationClass={animClass}
            />
          </div>
        );
      })}
    </div>
  );
}
