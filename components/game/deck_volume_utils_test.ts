import { assertEquals } from "@std/assert";
import { computeDeckLayers, deckLayerOffsets } from "./deck_volume_utils.ts";

// --- computeDeckLayers ---

Deno.test("computeDeckLayers: empty deck returns 0", () => {
  assertEquals(computeDeckLayers(0, 44), 0);
});

Deno.test("computeDeckLayers: single card returns 0", () => {
  assertEquals(computeDeckLayers(1, 44), 0);
});

Deno.test("computeDeckLayers: negative count returns 0", () => {
  assertEquals(computeDeckLayers(-5, 44), 0);
});

Deno.test("computeDeckLayers: small pile (2 cards) returns at least 1", () => {
  const layers = computeDeckLayers(2, 44);
  assertEquals(layers >= 1, true);
});

Deno.test("computeDeckLayers: quarter deck returns 1 or 2", () => {
  const layers = computeDeckLayers(11, 44);
  assertEquals(layers, 2);
});

Deno.test("computeDeckLayers: half deck returns 3", () => {
  const layers = computeDeckLayers(22, 44);
  assertEquals(layers, 3);
});

Deno.test("computeDeckLayers: three-quarter deck returns 4", () => {
  const layers = computeDeckLayers(33, 44);
  assertEquals(layers, 4);
});

Deno.test("computeDeckLayers: full deck returns 5", () => {
  assertEquals(computeDeckLayers(44, 44), 5);
});

Deno.test("computeDeckLayers: over-max clamped to 5", () => {
  assertEquals(computeDeckLayers(100, 44), 5);
});

Deno.test("computeDeckLayers: zero maxCount returns 0", () => {
  assertEquals(computeDeckLayers(5, 0), 0);
});

// --- deckLayerOffsets ---

Deno.test("deckLayerOffsets: empty deck returns []", () => {
  assertEquals(deckLayerOffsets(0, 44), []);
});

Deno.test("deckLayerOffsets: single card returns []", () => {
  assertEquals(deckLayerOffsets(1, 44), []);
});

Deno.test("deckLayerOffsets: 3 layers returns [3,2,1]", () => {
  // half deck (22/44) -> 3 layers
  assertEquals(deckLayerOffsets(22, 44), [3, 2, 1]);
});

Deno.test("deckLayerOffsets: full deck returns [5,4,3,2,1]", () => {
  assertEquals(deckLayerOffsets(44, 44), [5, 4, 3, 2, 1]);
});
