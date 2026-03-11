import { assertEquals } from "@std/assert";
import { createRateLimiter } from "./rate_limiter.ts";

Deno.test("allows requests under the limit", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
  for (let i = 0; i < 5; i++) {
    assertEquals(limiter.isAllowed("ip1"), true);
  }
});

Deno.test("blocks the request that exceeds the limit", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
  for (let i = 0; i < 5; i++) {
    limiter.isAllowed("ip1");
  }
  assertEquals(limiter.isAllowed("ip1"), false);
});

Deno.test("tracks different keys independently", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
  limiter.isAllowed("ip1");
  limiter.isAllowed("ip1");
  assertEquals(limiter.isAllowed("ip1"), false);
  assertEquals(limiter.isAllowed("ip2"), true);
});

Deno.test("allows requests again after the window expires", () => {
  const now = Date.now();
  let fakeNow = now;
  const limiter = createRateLimiter({
    windowMs: 1_000,
    maxRequests: 2,
    getNow: () => fakeNow,
  });

  limiter.isAllowed("ip1");
  limiter.isAllowed("ip1");
  assertEquals(limiter.isAllowed("ip1"), false);

  // Advance past the window
  fakeNow = now + 1_001;
  assertEquals(limiter.isAllowed("ip1"), true);
});

Deno.test("sliding window: old requests fall out as window advances", () => {
  const now = Date.now();
  let fakeNow = now;
  const limiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 3,
    getNow: () => fakeNow,
  });

  // Use 2 of 3 slots
  limiter.isAllowed("ip1"); // t=0
  limiter.isAllowed("ip1"); // t=0
  assertEquals(limiter.isAllowed("ip1"), true); // 3rd allowed

  // 4th blocked
  assertEquals(limiter.isAllowed("ip1"), false);

  // Advance 60s - all old timestamps expire
  fakeNow = now + 60_001;
  assertEquals(limiter.isAllowed("ip1"), true);
});
