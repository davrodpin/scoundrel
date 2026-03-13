import { useState } from "preact/hooks";
import type { Card } from "@scoundrel/engine";
import { cardBackPath, cardImagePath } from "@scoundrel/game";

type CardImageProps = {
  card?: Card;
  faceDown?: boolean;
  onClick?: () => void;
  highlighted?: boolean;
  selected?: boolean;
  focused?: boolean;
  disabled?: boolean;
  animationClass?: string;
};

export function CardImage(
  {
    card,
    faceDown,
    onClick,
    highlighted,
    selected,
    focused,
    disabled,
    animationClass,
  }: CardImageProps,
) {
  const [loaded, setLoaded] = useState(false);
  const src = faceDown || !card ? cardBackPath() : cardImagePath(card);
  const alt = faceDown || !card ? "Card back" : `${card.rank} of ${card.suit}`;

  const interactive = onClick && !disabled;

  let borderClass: string;
  if (selected) {
    borderClass =
      "border-torch-amber ring-2 ring-torch-glow shadow-[0_0_16px_rgba(230,168,50,0.7)] -translate-y-2";
  } else if (focused) {
    borderClass =
      "border-dashed border-torch-amber ring-2 ring-torch-amber/40 shadow-[0_0_8px_rgba(194,123,26,0.35)] -translate-y-1";
  } else if (highlighted) {
    borderClass = "border-torch-glow shadow-[0_0_8px_rgba(230,168,50,0.4)]";
  } else {
    borderClass = "border-dungeon-border";
  }

  return (
    <button
      type="button"
      onClick={interactive
        ? (e: MouseEvent) => {
          e.stopPropagation();
          onClick!();
        }
        : undefined}
      disabled={disabled}
      class={`w-[clamp(70px,20vw,100px)] md:w-[clamp(140px,28vw,230px)] rounded-sm border transition-transform duration-200 bg-dungeon-surface/30 ${borderClass} ${
        interactive
          ? "cursor-pointer hover:-translate-y-1 hover:border-torch-amber"
          : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${
        animationClass ?? ""
      }`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => setLoaded(true)}
        class={`w-full block transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
}
