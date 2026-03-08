import { assertEquals } from "@std/assert";
import { cardBackPath, cardImagePath } from "./cards.ts";
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
