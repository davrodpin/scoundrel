import type { Card } from "@scoundrel/engine";
import { getCardType } from "@scoundrel/engine";
import { cardTypeColor, rankLabel, suitSymbol } from "./svg_card_utils.ts";

type SvgCardProps = {
  card: Card;
  small?: boolean;
  dimmed?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
};

export default function SvgCard(
  { card, small, dimmed, highlighted, onClick }: SvgCardProps,
) {
  const type = getCardType(card);
  const borderColor = cardTypeColor(type);
  const symbol = suitSymbol(card.suit);
  const label = rankLabel(card.rank);
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const textColor = isRed ? "#c62828" : "#1c1410";

  const sizeClass = small ? "w-12" : "w-20";

  const opacityClass = dimmed ? "opacity-40" : "opacity-100";
  const ringClass = highlighted ? "ring-2 ring-torch-amber" : "";
  const cursorClass = onClick ? "cursor-pointer" : "";

  return (
    <div
      class={`${sizeClass} ${opacityClass} ${ringClass} ${cursorClass} transition-all duration-200 rounded-sm`}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 100 140"
        xmlns="http://www.w3.org/2000/svg"
        style="width: 100%; height: auto; display: block;"
      >
        {/* Card background */}
        <rect
          x="1"
          y="1"
          width="98"
          height="138"
          rx="2"
          fill="#d4c5a0"
          stroke={borderColor}
          stroke-width="3"
        />

        {/* Top-left rank + suit */}
        <text
          x="8"
          y="20"
          font-size="16"
          font-weight="bold"
          font-family="Georgia, serif"
          fill={textColor}
        >
          {label}
        </text>
        <text
          x="8"
          y="36"
          font-size="14"
          font-family="Georgia, serif"
          fill={textColor}
        >
          {symbol}
        </text>

        {/* Center suit symbol */}
        <text
          x="50"
          y="82"
          font-size="40"
          font-family="Georgia, serif"
          text-anchor="middle"
          dominant-baseline="middle"
          fill={textColor}
        >
          {symbol}
        </text>

        {/* Bottom-right rank + suit (mirrored top-left) */}
        <g transform="scale(-1,-1) translate(-100,-140)">
          <text
            x="8"
            y="20"
            font-size="16"
            font-weight="bold"
            font-family="Georgia, serif"
            fill={textColor}
          >
            {label}
          </text>
          <text
            x="8"
            y="36"
            font-size="14"
            font-family="Georgia, serif"
            fill={textColor}
          >
            {symbol}
          </text>
        </g>
      </svg>
    </div>
  );
}
