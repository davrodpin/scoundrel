import type { Card, CardType, Rank, Suit } from "./types.ts";

const ALL_RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const NUMBER_RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Creates the 44-card Scoundrel deck.
 * - Clubs & Spades: all 13 ranks (monsters)
 * - Diamonds: ranks 2-10 (weapons)
 * - Hearts: ranks 2-10 (potions)
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];

  const suitRanks: readonly [Suit, readonly Rank[]][] = [
    ["clubs", ALL_RANKS],
    ["spades", ALL_RANKS],
    ["diamonds", NUMBER_RANKS],
    ["hearts", NUMBER_RANKS],
  ];

  for (const [suit, ranks] of suitRanks) {
    for (const rank of ranks) {
      cards.push({ suit, rank });
    }
  }

  return cards;
}

/**
 * Fisher-Yates shuffle with injectable RNG.
 * Does not mutate the input array.
 */
export function shuffleDeck(
  cards: readonly Card[],
  random: () => number = Math.random,
): Card[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Returns the card type based on suit. */
export function getCardType(card: Card): CardType {
  switch (card.suit) {
    case "clubs":
    case "spades":
      return "monster";
    case "diamonds":
      return "weapon";
    case "hearts":
      return "potion";
  }
}

/** Returns the card's numeric value (its rank). */
export function cardValue(card: Card): number {
  return card.rank;
}
