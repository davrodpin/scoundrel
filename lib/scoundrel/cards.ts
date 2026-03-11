import type { Card, Rank, Suit } from "@scoundrel/engine";

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

// Monsters: clubs + spades, ranks 2-14 (A=14, J=11, Q=12, K=13)
// Weapons: diamonds, ranks 2-10
// Potions: hearts, ranks 2-10
// Red face cards and red aces are not in the game deck.
const MONSTER_SUITS: Suit[] = ["clubs", "spades"];
const MONSTER_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const PIP_SUITS: Suit[] = ["diamonds", "hearts"];
const PIP_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export function getAllCardImagePaths(): string[] {
  const paths: string[] = [];
  for (const suit of MONSTER_SUITS) {
    for (const rank of MONSTER_RANKS) {
      paths.push(cardImagePath({ suit, rank }));
    }
  }
  for (const suit of PIP_SUITS) {
    for (const rank of PIP_RANKS) {
      paths.push(cardImagePath({ suit, rank }));
    }
  }
  paths.push(cardBackPath());
  return paths;
}
