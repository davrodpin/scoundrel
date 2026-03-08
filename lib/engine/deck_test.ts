import { assertEquals, assertNotEquals } from "@std/assert";
import { cardValue, createDeck, getCardType, shuffleDeck } from "./deck.ts";
import type { Card } from "./types.ts";

// --- createDeck tests ---

Deno.test("createDeck returns exactly 44 cards", () => {
  const deck = createDeck();
  assertEquals(deck.length, 44);
});

Deno.test("createDeck has 26 monsters (13 clubs + 13 spades)", () => {
  const deck = createDeck();
  const monsters = deck.filter(
    (c) => c.suit === "clubs" || c.suit === "spades",
  );
  assertEquals(monsters.length, 26);
});

Deno.test("createDeck has 9 weapons (diamonds 2-10)", () => {
  const deck = createDeck();
  const weapons = deck.filter((c) => c.suit === "diamonds");
  assertEquals(weapons.length, 9);
  for (const w of weapons) {
    assertEquals(w.rank >= 2 && w.rank <= 10, true);
  }
});

Deno.test("createDeck has 9 potions (hearts 2-10)", () => {
  const deck = createDeck();
  const potions = deck.filter((c) => c.suit === "hearts");
  assertEquals(potions.length, 9);
  for (const p of potions) {
    assertEquals(p.rank >= 2 && p.rank <= 10, true);
  }
});

Deno.test("createDeck has no duplicate cards", () => {
  const deck = createDeck();
  const keys = deck.map((c) => `${c.suit}-${c.rank}`);
  const uniqueKeys = new Set(keys);
  assertEquals(uniqueKeys.size, deck.length);
});

// --- shuffleDeck tests ---

Deno.test("shuffleDeck returns same cards in different order with fixed RNG", () => {
  const deck = createDeck();
  let seed = 0.5;
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const shuffled = shuffleDeck(deck, rng);

  // Same cards (sorted)
  const sortKey = (a: Card, b: Card) =>
    `${a.suit}-${a.rank}`.localeCompare(`${b.suit}-${b.rank}`);
  const sortedOriginal = [...deck].sort(sortKey);
  const sortedShuffled = [...shuffled].sort(sortKey);
  assertEquals(sortedShuffled, sortedOriginal);

  // Different order
  const originalKeys = deck.map((c) => `${c.suit}-${c.rank}`).join(",");
  const shuffledKeys = shuffled.map((c) => `${c.suit}-${c.rank}`).join(",");
  assertNotEquals(shuffledKeys, originalKeys);
});

Deno.test("shuffleDeck with injectable RNG produces deterministic results", () => {
  const deck = createDeck();
  const makeRng = () => {
    let seed = 42;
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };

  const shuffled1 = shuffleDeck(deck, makeRng());
  const shuffled2 = shuffleDeck(deck, makeRng());
  assertEquals(shuffled1, shuffled2);
});

Deno.test("shuffleDeck does not mutate the input array", () => {
  const deck = createDeck();
  const original = [...deck];
  shuffleDeck(deck);
  assertEquals(deck, original);
});

// --- getCardType tests ---

Deno.test("getCardType returns monster for clubs", () => {
  assertEquals(getCardType({ suit: "clubs", rank: 5 }), "monster");
});

Deno.test("getCardType returns monster for spades", () => {
  assertEquals(getCardType({ suit: "spades", rank: 14 }), "monster");
});

Deno.test("getCardType returns weapon for diamonds", () => {
  assertEquals(getCardType({ suit: "diamonds", rank: 7 }), "weapon");
});

Deno.test("getCardType returns potion for hearts", () => {
  assertEquals(getCardType({ suit: "hearts", rank: 3 }), "potion");
});

// --- cardValue tests ---

Deno.test("cardValue returns the rank as the value", () => {
  assertEquals(cardValue({ suit: "clubs", rank: 10 }), 10);
  assertEquals(cardValue({ suit: "spades", rank: 14 }), 14);
  assertEquals(cardValue({ suit: "diamonds", rank: 2 }), 2);
  assertEquals(cardValue({ suit: "hearts", rank: 9 }), 9);
});
