import { assertEquals } from "@std/assert";
import { preloadImages } from "./image_preloader.ts";
import type { PreloadProgress } from "./image_preloader.ts";

// Helper to create a controllable fake Image class.
// Returns the class and a list of created instances (so tests can trigger onload/onerror).
function makeFakeImageClass(): {
  FakeImage: typeof globalThis.Image;
  instances: {
    src: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
  }[];
} {
  const instances: {
    src: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
  }[] = [];

  class FakeImage {
    src = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor() {
      instances.push(
        this as unknown as {
          src: string;
          onload: (() => void) | null;
          onerror: (() => void) | null;
        },
      );
    }

    set _src(value: string) {
      this.src = value;
    }
  }

  // Make src setter trigger nothing — tests control load/error manually.
  return {
    FakeImage: FakeImage as unknown as typeof globalThis.Image,
    instances,
  };
}

Deno.test("preloadImages — resolves immediately with zero counts for empty array", async () => {
  const result = await preloadImages([], () => {});
  assertEquals(result, { succeeded: 0, failed: 0, total: 0 });
});

Deno.test("preloadImages — calls onProgress after each image loads", async () => {
  const { FakeImage, instances } = makeFakeImageClass();
  const originalImage = globalThis.Image;
  globalThis.Image = FakeImage;

  try {
    const progressCalls: PreloadProgress[] = [];
    const promise = preloadImages(
      ["/decks/dungeon/clubs_2.jpg", "/decks/dungeon/spades_j.jpg"],
      (p) => progressCalls.push({ ...p }),
    );

    // Simulate both images loading
    instances[0].onload?.();
    instances[1].onload?.();

    await promise;

    assertEquals(progressCalls.length, 2);
    assertEquals(progressCalls[0], { loaded: 1, total: 2 });
    assertEquals(progressCalls[1], { loaded: 2, total: 2 });
  } finally {
    globalThis.Image = originalImage;
  }
});

Deno.test("preloadImages — resolves with correct succeeded/failed/total", async () => {
  const { FakeImage, instances } = makeFakeImageClass();
  const originalImage = globalThis.Image;
  globalThis.Image = FakeImage;

  try {
    const promise = preloadImages(
      ["/a.jpg", "/b.jpg", "/c.jpg"],
      () => {},
    );

    instances[0].onload?.();
    instances[1].onerror?.();
    instances[2].onload?.();

    const result = await promise;
    assertEquals(result, { succeeded: 2, failed: 1, total: 3 });
  } finally {
    globalThis.Image = originalImage;
  }
});

Deno.test("preloadImages — counts errored images as progress (allSettled behavior)", async () => {
  const { FakeImage, instances } = makeFakeImageClass();
  const originalImage = globalThis.Image;
  globalThis.Image = FakeImage;

  try {
    const progressCalls: PreloadProgress[] = [];
    const promise = preloadImages(
      ["/a.jpg", "/b.jpg"],
      (p) => progressCalls.push({ ...p }),
    );

    instances[0].onerror?.();
    instances[1].onerror?.();

    await promise;

    assertEquals(progressCalls.length, 2);
    assertEquals(progressCalls[1], { loaded: 2, total: 2 });
  } finally {
    globalThis.Image = originalImage;
  }
});

Deno.test("preloadImages — handles all images failing gracefully", async () => {
  const { FakeImage, instances } = makeFakeImageClass();
  const originalImage = globalThis.Image;
  globalThis.Image = FakeImage;

  try {
    const promise = preloadImages(["/a.jpg", "/b.jpg"], () => {});

    instances[0].onerror?.();
    instances[1].onerror?.();

    const result = await promise;
    assertEquals(result, { succeeded: 0, failed: 2, total: 2 });
  } finally {
    globalThis.Image = originalImage;
  }
});

Deno.test("preloadImages — resolves after timeout even if images are still pending", async () => {
  const { FakeImage } = makeFakeImageClass();
  const originalImage = globalThis.Image;
  globalThis.Image = FakeImage;

  try {
    // Use a very short timeout (10ms) to avoid slowing down the test suite.
    const result = await preloadImages(["/a.jpg"], () => {}, 10);
    // No images triggered onload/onerror — the timeout should resolve.
    assertEquals(result.total, 1);
  } finally {
    globalThis.Image = originalImage;
  }
});
