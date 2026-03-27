import { assertEquals } from "@std/assert";
import { resolveActionKind } from "./_middleware_helpers.ts";

Deno.test("resolveActionKind — draw_card action returns draw_card", () => {
  assertEquals(resolveActionKind({ type: "draw_card" }, null), "draw_card");
});

Deno.test("resolveActionKind — enter_room action returns enter_room", () => {
  assertEquals(resolveActionKind({ type: "enter_room" }, null), "enter_room");
});

Deno.test("resolveActionKind — avoid_room action returns avoid_room", () => {
  assertEquals(resolveActionKind({ type: "avoid_room" }, null), "avoid_room");
});

Deno.test("resolveActionKind — choose_card monster barehanded returns combat_barehanded", () => {
  const card = { suit: "clubs" as const, rank: 7 as const };
  assertEquals(
    resolveActionKind(
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      card,
    ),
    "combat_barehanded",
  );
});

Deno.test("resolveActionKind — choose_card monster with weapon returns combat_with_weapon", () => {
  const card = { suit: "spades" as const, rank: 11 as const };
  assertEquals(
    resolveActionKind(
      { type: "choose_card", cardIndex: 0, fightWith: "weapon" },
      card,
    ),
    "combat_with_weapon",
  );
});

Deno.test("resolveActionKind — choose_card weapon returns equip_weapon", () => {
  const card = { suit: "diamonds" as const, rank: 8 as const };
  assertEquals(
    resolveActionKind(
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      card,
    ),
    "equip_weapon",
  );
});

Deno.test("resolveActionKind — choose_card potion returns drink_potion", () => {
  const card = { suit: "hearts" as const, rank: 5 as const };
  assertEquals(
    resolveActionKind(
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      card,
    ),
    "drink_potion",
  );
});

Deno.test("resolveActionKind — non-action body returns undefined", () => {
  assertEquals(resolveActionKind(null, null), undefined);
  assertEquals(resolveActionKind({}, null), undefined);
  assertEquals(resolveActionKind("not an object", null), undefined);
});

Deno.test("resolveActionKind — choose_card with null lastCardPlayed returns choose_card", () => {
  assertEquals(
    resolveActionKind(
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      null,
    ),
    "choose_card",
  );
});
