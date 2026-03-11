import { assertEquals } from "@std/assert";
import { cardBackPath, cardImagePath, getAllCardImagePaths } from "./cards.ts";
import type { Card } from "@scoundrel/engine";

// --- cardImagePath ---

Deno.test("cardImagePath: number card returns suit_rank path", () => {
  const card: Card = { suit: "clubs", rank: 5 };
  assertEquals(cardImagePath(card), "/cards/clubs_5.jpg");
});

Deno.test("cardImagePath: rank 10 returns suit_10 path", () => {
  const card: Card = { suit: "spades", rank: 10 };
  assertEquals(cardImagePath(card), "/cards/spades_10.jpg");
});

Deno.test("cardImagePath: rank 11 (Jack) returns suit_j path", () => {
  const card: Card = { suit: "clubs", rank: 11 };
  assertEquals(cardImagePath(card), "/cards/clubs_j.jpg");
});

Deno.test("cardImagePath: rank 12 (Queen) returns suit_q path", () => {
  const card: Card = { suit: "spades", rank: 12 };
  assertEquals(cardImagePath(card), "/cards/spades_q.jpg");
});

Deno.test("cardImagePath: rank 13 (King) returns suit_k path", () => {
  const card: Card = { suit: "clubs", rank: 13 };
  assertEquals(cardImagePath(card), "/cards/clubs_k.jpg");
});

Deno.test("cardImagePath: rank 14 (Ace) returns suit_a path", () => {
  const card: Card = { suit: "spades", rank: 14 };
  assertEquals(cardImagePath(card), "/cards/spades_a.jpg");
});

Deno.test("cardImagePath: diamonds suit", () => {
  const card: Card = { suit: "diamonds", rank: 7 };
  assertEquals(cardImagePath(card), "/cards/diamonds_7.jpg");
});

Deno.test("cardImagePath: hearts suit", () => {
  const card: Card = { suit: "hearts", rank: 3 };
  assertEquals(cardImagePath(card), "/cards/hearts_3.jpg");
});

// --- cardBackPath ---

Deno.test("cardBackPath: returns card cover path", () => {
  assertEquals(cardBackPath(), "/cards/card_cover.jpg");
});

// --- getAllCardImagePaths ---

Deno.test("getAllCardImagePaths: returns 45 paths (44 cards + 1 card back)", () => {
  const paths = getAllCardImagePaths();
  // 13 clubs + 13 spades + 9 diamonds + 9 hearts + 1 card back = 45
  assertEquals(paths.length, 45);
});

Deno.test("getAllCardImagePaths: all paths start with /cards/", () => {
  const paths = getAllCardImagePaths();
  for (const path of paths) {
    assertEquals(path.startsWith("/cards/"), true, `Expected ${path} to start with /cards/`);
  }
});

Deno.test("getAllCardImagePaths: includes card back", () => {
  const paths = getAllCardImagePaths();
  assertEquals(paths.includes("/cards/card_cover.jpg"), true);
});

Deno.test("getAllCardImagePaths: includes all club ranks (2-A)", () => {
  const paths = getAllCardImagePaths();
  assertEquals(paths.includes("/cards/clubs_2.jpg"), true);
  assertEquals(paths.includes("/cards/clubs_10.jpg"), true);
  assertEquals(paths.includes("/cards/clubs_j.jpg"), true);
  assertEquals(paths.includes("/cards/clubs_q.jpg"), true);
  assertEquals(paths.includes("/cards/clubs_k.jpg"), true);
  assertEquals(paths.includes("/cards/clubs_a.jpg"), true);
});

Deno.test("getAllCardImagePaths: includes diamond pips only (2-10, no face cards)", () => {
  const paths = getAllCardImagePaths();
  assertEquals(paths.includes("/cards/diamonds_2.jpg"), true);
  assertEquals(paths.includes("/cards/diamonds_10.jpg"), true);
  assertEquals(paths.includes("/cards/diamonds_j.jpg"), false);
  assertEquals(paths.includes("/cards/diamonds_a.jpg"), false);
});

Deno.test("getAllCardImagePaths: all paths are unique", () => {
  const paths = getAllCardImagePaths();
  const unique = new Set(paths);
  assertEquals(unique.size, paths.length);
});
