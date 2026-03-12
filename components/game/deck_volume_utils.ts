export const DUNGEON_MAX_CARDS = 44;

/** Returns the number of visual depth layers (0–5) for a pile of `count` cards. */
export function computeDeckLayers(count: number, maxCount: number): number {
  if (maxCount <= 0 || count <= 1) return 0;
  const raw = Math.ceil((count / maxCount) * 5);
  return Math.min(Math.max(raw, 1), 5);
}

/**
 * Returns offset multipliers ordered deepest-first.
 * e.g. 3 layers → [3, 2, 1]
 */
export function deckLayerOffsets(count: number, maxCount: number): number[] {
  const layers = computeDeckLayers(count, maxCount);
  const offsets: number[] = [];
  for (let i = layers; i >= 1; i--) {
    offsets.push(i);
  }
  return offsets;
}
