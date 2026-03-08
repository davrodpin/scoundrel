import type { Card, Rank } from "@scoundrel/engine";

const FACE_CARD_MAP: Partial<Record<Rank, string>> = {
  11: "j",
  12: "q",
  13: "k",
  14: "a",
};

export function cardImagePath(card: Card): string {
  const value = FACE_CARD_MAP[card.rank] ?? String(card.rank);
  return `/cards/${card.suit}_${value}.jpg`;
}

export function cardBackPath(): string {
  return "/cards/card_cover.jpg";
}
