import type { CardType, Rank, Suit } from "@scoundrel/engine";

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case "clubs":
      return "♣";
    case "spades":
      return "♠";
    case "diamonds":
      return "♦";
    case "hearts":
      return "♥";
  }
}

export function rankLabel(rank: Rank): string {
  switch (rank) {
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    case 14:
      return "A";
    default:
      return String(rank);
  }
}

export function cardTypeColor(type: CardType): string {
  switch (type) {
    case "monster":
      return "#8b1a1a";
    case "weapon":
      return "#7a7d85";
    case "potion":
      return "#2e6b30";
  }
}
