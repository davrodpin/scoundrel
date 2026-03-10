import { assertEquals } from "@std/assert";
import { cardTypeColor, rankLabel, suitSymbol } from "./svg_card_utils.ts";

Deno.test("suitSymbol - clubs returns ♣", () => {
  assertEquals(suitSymbol("clubs"), "♣");
});

Deno.test("suitSymbol - spades returns ♠", () => {
  assertEquals(suitSymbol("spades"), "♠");
});

Deno.test("suitSymbol - diamonds returns ♦", () => {
  assertEquals(suitSymbol("diamonds"), "♦");
});

Deno.test("suitSymbol - hearts returns ♥", () => {
  assertEquals(suitSymbol("hearts"), "♥");
});

Deno.test("rankLabel - number ranks return string digits", () => {
  assertEquals(rankLabel(2), "2");
  assertEquals(rankLabel(9), "9");
  assertEquals(rankLabel(10), "10");
});

Deno.test("rankLabel - face cards return letters", () => {
  assertEquals(rankLabel(11), "J");
  assertEquals(rankLabel(12), "Q");
  assertEquals(rankLabel(13), "K");
  assertEquals(rankLabel(14), "A");
});

Deno.test("cardTypeColor - monster returns blood-red", () => {
  assertEquals(cardTypeColor("monster"), "#8b1a1a");
});

Deno.test("cardTypeColor - weapon returns weapon-steel", () => {
  assertEquals(cardTypeColor("weapon"), "#7a7d85");
});

Deno.test("cardTypeColor - potion returns potion-green", () => {
  assertEquals(cardTypeColor("potion"), "#2e6b30");
});
