import { assertEquals } from "@std/assert";
import { shouldApplyDeckCache } from "./main_helpers.ts";

Deno.test("shouldApplyDeckCache — returns true for dungeon deck image", () => {
  assertEquals(shouldApplyDeckCache("/decks/dungeon/clubs_2.jpg"), true);
});

Deno.test("shouldApplyDeckCache — returns true for 8bit deck image", () => {
  assertEquals(shouldApplyDeckCache("/decks/8bit/clubs_2.png"), true);
});

Deno.test("shouldApplyDeckCache — returns true for deck manifest", () => {
  assertEquals(shouldApplyDeckCache("/decks/manifest.json"), true);
});

Deno.test("shouldApplyDeckCache — returns false for API routes", () => {
  assertEquals(shouldApplyDeckCache("/api/games"), false);
});

Deno.test("shouldApplyDeckCache — returns false for Fresh JS assets", () => {
  assertEquals(shouldApplyDeckCache("/_fresh/js/chunk.js"), false);
});

Deno.test("shouldApplyDeckCache — returns false for root path", () => {
  assertEquals(shouldApplyDeckCache("/"), false);
});

Deno.test("shouldApplyDeckCache — returns false for legacy card paths", () => {
  assertEquals(shouldApplyDeckCache("/cards/clubs_2.jpg"), false);
});
