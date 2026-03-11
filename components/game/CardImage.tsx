import type { Card } from "@scoundrel/engine";
import { cardBackPath, cardImagePath } from "@scoundrel/game";

type CardImageProps = {
  card?: Card;
  faceDown?: boolean;
  onClick?: () => void;
  highlighted?: boolean;
  disabled?: boolean;
};

export function CardImage(
  { card, faceDown, onClick, highlighted, disabled }: CardImageProps,
) {
  const src = faceDown || !card ? cardBackPath() : cardImagePath(card);
  const alt = faceDown || !card ? "Card back" : `${card.rank} of ${card.suit}`;

  const interactive = onClick && !disabled;

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={disabled}
      class={`w-[clamp(140px,28vw,230px)] aspect-[5/7] overflow-hidden rounded-sm border transition-transform duration-200 ${
        highlighted
          ? "border-torch-glow shadow-[0_0_8px_rgba(230,168,50,0.4)]"
          : "border-dungeon-border"
      } ${
        interactive
          ? "cursor-pointer hover:-translate-y-1 hover:border-torch-amber"
          : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        class="w-full h-full object-cover block"
      />
    </button>
  );
}
