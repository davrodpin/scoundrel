import { assertEquals } from "@std/assert";
import { isPlayerNameAllowed } from "./player_name.ts";

Deno.test("isPlayerNameAllowed - allows normal names", () => {
  assertEquals(isPlayerNameAllowed("Alice"), true);
  assertEquals(isPlayerNameAllowed("DragonSlayer"), true);
  assertEquals(isPlayerNameAllowed("x"), true);
  assertEquals(isPlayerNameAllowed("Player123"), true);
  assertEquals(isPlayerNameAllowed("A".repeat(30)), true);
});

Deno.test("isPlayerNameAllowed - allows Scunthorpe-type names", () => {
  // These contain substrings that naive filters block incorrectly
  assertEquals(isPlayerNameAllowed("Scunthorpe"), true);
  assertEquals(isPlayerNameAllowed("Assassin"), true);
  assertEquals(isPlayerNameAllowed("Classic"), true);
  assertEquals(isPlayerNameAllowed("Cocktail"), true);
});

Deno.test("isPlayerNameAllowed - rejects common profanity", () => {
  assertEquals(isPlayerNameAllowed("fuck"), false);
  assertEquals(isPlayerNameAllowed("shit"), false);
  assertEquals(isPlayerNameAllowed("ass"), false);
  assertEquals(isPlayerNameAllowed("bitch"), false);
});

Deno.test("isPlayerNameAllowed - rejects mixed case profanity", () => {
  assertEquals(isPlayerNameAllowed("Fuck"), false);
  assertEquals(isPlayerNameAllowed("SHIT"), false);
  assertEquals(isPlayerNameAllowed("ShIt"), false);
});

Deno.test("isPlayerNameAllowed - rejects l33t speak variants", () => {
  assertEquals(isPlayerNameAllowed("sh1t"), false);
  assertEquals(isPlayerNameAllowed("@ss"), false);
  assertEquals(isPlayerNameAllowed("f4ck"), false);
});

Deno.test("isPlayerNameAllowed - rejects spaced evasion", () => {
  assertEquals(isPlayerNameAllowed("f u c k"), false);
  assertEquals(isPlayerNameAllowed("s h i t"), false);
});
