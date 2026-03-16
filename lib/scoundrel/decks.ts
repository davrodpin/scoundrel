import { z } from "zod";
import type { Card, Rank } from "@scoundrel/engine";

export type DeckManifest = {
  defaultDeck: string;
  decks: string[];
};

export type DeckMetadata = {
  name: string;
  cards: Record<string, string>;
};

export type DeckInfo = {
  id: string;
  name: string;
  basePath: string;
  cards: Record<string, string>;
};

const FACE_CARD_MAP: Partial<Record<Rank, string>> = {
  11: "j",
  12: "q",
  13: "k",
  14: "a",
};

export function cardIdentifier(card: Card): string {
  const value = FACE_CARD_MAP[card.rank] ?? String(card.rank);
  return `${card.suit}_${value}`;
}

const MONSTER_SUITS = ["clubs", "spades"] as const;
const MONSTER_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const PIP_SUITS = ["diamonds", "hearts"] as const;
const PIP_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export function getAllCardIdentifiers(): string[] {
  const ids: string[] = [];
  for (const suit of MONSTER_SUITS) {
    for (const rank of MONSTER_RANKS) {
      ids.push(cardIdentifier({ suit, rank }));
    }
  }
  for (const suit of PIP_SUITS) {
    for (const rank of PIP_RANKS) {
      ids.push(cardIdentifier({ suit, rank }));
    }
  }
  ids.push("card_back");
  return ids;
}

export function deckCardImagePath(deck: DeckInfo, card: Card): string {
  const id = cardIdentifier(card);
  return `${deck.basePath}/${deck.cards[id]}`;
}

export function deckCardBackPath(deck: DeckInfo): string {
  return `${deck.basePath}/${deck.cards["card_back"]}`;
}

export function getAllDeckCardImagePaths(deck: DeckInfo): string[] {
  return getAllCardIdentifiers().map((id) =>
    `${deck.basePath}/${deck.cards[id]}`
  );
}

const DeckMetadataSchema = z.object({
  name: z.string(),
  cards: z.record(z.string(), z.string()),
});

export function validateDeckMetadata(data: unknown): DeckMetadata | null {
  const result = DeckMetadataSchema.safeParse(data);
  return result.success ? result.data : null;
}
