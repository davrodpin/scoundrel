/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import {
  buildCardPool,
  FloatingCardRiver,
  generateCardLayout,
  shuffleAndPick,
} from "./FloatingCardRiver.tsx";
import type { DeckInfo } from "@scoundrel/game";

const dungeonDeck: DeckInfo = {
  id: "dungeon",
  name: "Dungeon",
  basePath: "/decks/dungeon",
  cards: {
    clubs_2: "clubs_2.jpg",
    clubs_3: "clubs_3.jpg",
    clubs_4: "clubs_4.jpg",
    clubs_5: "clubs_5.jpg",
    clubs_6: "clubs_6.jpg",
    clubs_7: "clubs_7.jpg",
    clubs_8: "clubs_8.jpg",
    clubs_9: "clubs_9.jpg",
    clubs_10: "clubs_10.jpg",
    clubs_j: "clubs_j.jpg",
    clubs_q: "clubs_q.jpg",
    clubs_k: "clubs_k.jpg",
    clubs_a: "clubs_a.jpg",
    spades_2: "spades_2.jpg",
    spades_3: "spades_3.jpg",
    spades_4: "spades_4.jpg",
    spades_5: "spades_5.jpg",
    spades_6: "spades_6.jpg",
    spades_7: "spades_7.jpg",
    spades_8: "spades_8.jpg",
    spades_9: "spades_9.jpg",
    spades_10: "spades_10.jpg",
    spades_j: "spades_j.jpg",
    spades_q: "spades_q.jpg",
    spades_k: "spades_k.jpg",
    spades_a: "spades_a.jpg",
    diamonds_2: "diamonds_2.jpg",
    diamonds_3: "diamonds_3.jpg",
    diamonds_4: "diamonds_4.jpg",
    diamonds_5: "diamonds_5.jpg",
    diamonds_6: "diamonds_6.jpg",
    diamonds_7: "diamonds_7.jpg",
    diamonds_8: "diamonds_8.jpg",
    diamonds_9: "diamonds_9.jpg",
    diamonds_10: "diamonds_10.jpg",
    hearts_2: "hearts_2.jpg",
    hearts_3: "hearts_3.jpg",
    hearts_4: "hearts_4.jpg",
    hearts_5: "hearts_5.jpg",
    hearts_6: "hearts_6.jpg",
    hearts_7: "hearts_7.jpg",
    hearts_8: "hearts_8.jpg",
    hearts_9: "hearts_9.jpg",
    hearts_10: "hearts_10.jpg",
    card_back: "card_cover.jpg",
  },
};

const eightBitDeck: DeckInfo = {
  id: "8bit",
  name: "Dungeon (8-bit)",
  basePath: "/decks/8bit",
  cards: { ...dungeonDeck.cards },
};

// --- buildCardPool tests ---

Deno.test("buildCardPool - returns empty array for no decks", () => {
  const pool = buildCardPool([]);
  assertEquals(pool.length, 0);
});

Deno.test("buildCardPool - returns 44 entries for one deck", () => {
  const pool = buildCardPool([dungeonDeck]);
  assertEquals(pool.length, 44);
});

Deno.test("buildCardPool - returns 88 entries for two decks", () => {
  const pool = buildCardPool([dungeonDeck, eightBitDeck]);
  assertEquals(pool.length, 88);
});

Deno.test("buildCardPool - paths are prefixed with deck basePath", () => {
  const pool = buildCardPool([dungeonDeck]);
  const allPrefixed = pool.every((entry) =>
    entry.imagePath.startsWith("/decks/dungeon/")
  );
  assertEquals(allPrefixed, true);
});

Deno.test("buildCardPool - entries contain deckId", () => {
  const pool = buildCardPool([dungeonDeck]);
  const allHaveDeckId = pool.every((entry) => entry.deckId === "dungeon");
  assertEquals(allHaveDeckId, true);
});

Deno.test("buildCardPool - mixed decks have correct deckIds", () => {
  const pool = buildCardPool([dungeonDeck, eightBitDeck]);
  const dungeonEntries = pool.filter((e) => e.deckId === "dungeon");
  const eightBitEntries = pool.filter((e) => e.deckId === "8bit");
  assertEquals(dungeonEntries.length, 44);
  assertEquals(eightBitEntries.length, 44);
});

// --- shuffleAndPick tests ---

Deno.test("shuffleAndPick - returns requested count when pool is larger", () => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = shuffleAndPick(pool, 5);
  assertEquals(result.length, 5);
});

Deno.test("shuffleAndPick - returns all items when count exceeds pool size", () => {
  const pool = [1, 2, 3];
  const result = shuffleAndPick(pool, 10);
  assertEquals(result.length, 3);
});

Deno.test("shuffleAndPick - returns empty for empty pool", () => {
  const result = shuffleAndPick([], 5);
  assertEquals(result.length, 0);
});

Deno.test("shuffleAndPick - all returned items come from the original pool", () => {
  const pool = [10, 20, 30, 40, 50];
  const result = shuffleAndPick(pool, 3);
  const allFromPool = result.every((item) => pool.includes(item));
  assertEquals(allFromPool, true);
});

Deno.test("shuffleAndPick - does not mutate the original pool", () => {
  const pool = [1, 2, 3, 4, 5];
  const original = [...pool];
  shuffleAndPick(pool, 3);
  assertEquals(pool, original);
});

// --- FloatingCardRiver component tests ---

Deno.test("FloatingCardRiver - renders as aria-hidden", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes('aria-hidden="true"'), true);
});

Deno.test("FloatingCardRiver - has pointer-events-none", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes("pointer-events-none"), true);
});

Deno.test("FloatingCardRiver - renders no images on initial server render", () => {
  // useEffect doesn't run in preact-render-to-string, so initial state is empty
  const html = render(<FloatingCardRiver decks={[dungeonDeck]} />);
  assertEquals(html.includes("<img"), false);
});

Deno.test("FloatingCardRiver - desktop container has card-river-down animation class", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes("animate-card-river-down"), true);
});

Deno.test("FloatingCardRiver - desktop container has card-river-up animation class", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes("animate-card-river-up"), true);
});

Deno.test("FloatingCardRiver - mobile ribbon has card-river-horizontal animation class", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes("animate-card-river-horizontal"), true);
});

Deno.test("FloatingCardRiver - desktop columns are hidden on mobile", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes("hidden md:flex"), true);
});

Deno.test("FloatingCardRiver - mobile ribbon is hidden on desktop", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes("flex md:hidden"), true);
});

Deno.test("FloatingCardRiver - river lanes have dark background", () => {
  const html = render(<FloatingCardRiver decks={[]} />);
  assertEquals(html.includes("bg-river-dark"), true);
});

// --- generateCardLayout tests ---

const sampleCards = [
  { imagePath: "/a.jpg", deckId: "d" },
  { imagePath: "/b.jpg", deckId: "d" },
  { imagePath: "/c.jpg", deckId: "d" },
  { imagePath: "/e.jpg", deckId: "d" },
];

Deno.test("generateCardLayout - returns same number of entries as input", () => {
  const layout = generateCardLayout(sampleCards);
  assertEquals(layout.length, sampleCards.length);
});

Deno.test("generateCardLayout - each entry has offsetX, gapY, rotationClass", () => {
  const layout = generateCardLayout(sampleCards);
  for (const entry of layout) {
    assertEquals(typeof entry.offsetX, "number");
    assertEquals(typeof entry.gapY, "number");
    assertEquals(typeof entry.rotationClass, "string");
  }
});

Deno.test("generateCardLayout - gapY is between 8 and 40 inclusive", () => {
  const cards = Array.from({ length: 20 }, (_, i) => ({
    imagePath: `/img/${i}.jpg`,
    deckId: "d",
  }));
  for (let run = 0; run < 50; run++) {
    const layout = generateCardLayout(cards);
    for (const entry of layout) {
      assertEquals(entry.gapY >= 8, true);
      assertEquals(entry.gapY <= 40, true);
    }
  }
});

Deno.test("generateCardLayout - preserves imagePath and deckId from source", () => {
  const layout = generateCardLayout(sampleCards);
  for (let i = 0; i < sampleCards.length; i++) {
    assertEquals(layout[i].imagePath, sampleCards[i].imagePath);
    assertEquals(layout[i].deckId, sampleCards[i].deckId);
  }
});
