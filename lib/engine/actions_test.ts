import { assertEquals } from "@std/assert";
import { GameActionSchema } from "./actions.ts";

Deno.test("GameActionSchema parses valid draw_card action", () => {
  const result = GameActionSchema.safeParse({ type: "draw_card" });
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, { type: "draw_card" });
  }
});

Deno.test("GameActionSchema rejects draw_card with extra fields", () => {
  const result = GameActionSchema.safeParse({
    type: "draw_card",
    extra: "field",
  });
  assertEquals(result.success, false);
});

Deno.test("GameActionSchema parses valid avoid_room action", () => {
  const result = GameActionSchema.safeParse({ type: "avoid_room" });
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, { type: "avoid_room" });
  }
});

Deno.test("GameActionSchema parses valid choose_card action", () => {
  const result = GameActionSchema.safeParse({
    type: "choose_card",
    cardIndex: 2,
    fightWith: "weapon",
  });
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, {
      type: "choose_card",
      cardIndex: 2,
      fightWith: "weapon",
    });
  }
});

Deno.test("GameActionSchema parses choose_card with barehanded fightWith", () => {
  const result = GameActionSchema.safeParse({
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(result.success, true);
  if (result.success && result.data.type === "choose_card") {
    assertEquals(result.data.fightWith, "barehanded");
  }
});

Deno.test("GameActionSchema rejects unknown action type", () => {
  const result = GameActionSchema.safeParse({ type: "unknown_action" });
  assertEquals(result.success, false);
});

Deno.test("GameActionSchema rejects choose_card with negative cardIndex", () => {
  const result = GameActionSchema.safeParse({
    type: "choose_card",
    cardIndex: -1,
    fightWith: "weapon",
  });
  assertEquals(result.success, false);
});

Deno.test("GameActionSchema rejects choose_card with non-integer cardIndex", () => {
  const result = GameActionSchema.safeParse({
    type: "choose_card",
    cardIndex: 1.5,
    fightWith: "weapon",
  });
  assertEquals(result.success, false);
});

Deno.test("GameActionSchema rejects choose_card with invalid fightWith value", () => {
  const result = GameActionSchema.safeParse({
    type: "choose_card",
    cardIndex: 0,
    fightWith: "magic",
  });
  assertEquals(result.success, false);
});

Deno.test("GameActionSchema rejects draw_room as unknown action", () => {
  const result = GameActionSchema.safeParse({ type: "draw_room" });
  assertEquals(result.success, false);
});

Deno.test("GameActionSchema rejects choose_card with missing cardIndex", () => {
  const result = GameActionSchema.safeParse({
    type: "choose_card",
    fightWith: "weapon",
  });
  assertEquals(result.success, false);
});

Deno.test("GameActionSchema rejects choose_card with missing fightWith", () => {
  const result = GameActionSchema.safeParse({
    type: "choose_card",
    cardIndex: 0,
  });
  assertEquals(result.success, false);
});

// --- enter_room ---

Deno.test("GameActionSchema parses valid enter_room action", () => {
  const result = GameActionSchema.safeParse({ type: "enter_room" });
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, { type: "enter_room" });
  }
});

Deno.test("GameActionSchema rejects enter_room with extra fields", () => {
  const result = GameActionSchema.safeParse({
    type: "enter_room",
    extra: "field",
  });
  assertEquals(result.success, false);
});

// --- fill_room ---

Deno.test("GameActionSchema parses valid fill_room action", () => {
  const result = GameActionSchema.safeParse({ type: "fill_room" });
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, { type: "fill_room" });
  }
});

Deno.test("GameActionSchema rejects fill_room with extra fields", () => {
  const result = GameActionSchema.safeParse({
    type: "fill_room",
    extra: "field",
  });
  assertEquals(result.success, false);
});
