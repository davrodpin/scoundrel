import { assertEquals, assertThrows } from "@std/assert";
import { ZodError } from "zod";
import { createConfig } from "./config.ts";

const VALID_RAW = {
  db: { url: "postgres://localhost/test" },
  app: {
    origin: "https://example.com",
    maxBodyBytes: 1024,
    maxPlayerNameLength: 20,
  },
  game: { defaultPlayerName: "Hero", leaderboardLimit: 10 },
  deploy: { id: "abc123" },
};

Deno.test("valid config parses successfully", () => {
  const cfg = createConfig(VALID_RAW);
  assertEquals(cfg.db.url, "postgres://localhost/test");
  assertEquals(cfg.app.origin, "https://example.com");
  assertEquals(cfg.app.maxBodyBytes, 1024);
  assertEquals(cfg.app.maxPlayerNameLength, 20);
  assertEquals(cfg.game.defaultPlayerName, "Hero");
  assertEquals(cfg.game.leaderboardLimit, 10);
  assertEquals(cfg.deploy.id, "abc123");
});

Deno.test("missing db.url throws ZodError", () => {
  assertThrows(
    () => createConfig({ db: {}, app: {}, game: {}, deploy: {} }),
    ZodError,
  );
});

Deno.test("defaults applied for optional fields", () => {
  const cfg = createConfig({ db: { url: "postgres://localhost/test" } });
  assertEquals(cfg.app.origin, "https://scoundrel.gg");
  assertEquals(cfg.app.maxBodyBytes, 4096);
  assertEquals(cfg.app.maxPlayerNameLength, 16);
  assertEquals(cfg.game.defaultPlayerName, "Anonymous");
  assertEquals(cfg.game.leaderboardLimit, 100);
  assertEquals(cfg.deploy.id, undefined);
});

Deno.test("invalid values (negative numbers) rejected", () => {
  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        app: { maxBodyBytes: -1 },
      }),
    ZodError,
  );
});

Deno.test("cleanup.retentionDays defaults to 30 when not provided", () => {
  const cfg = createConfig({ db: { url: "postgres://localhost/test" } });
  assertEquals(cfg.cleanup.retentionDays, 30);
});

Deno.test("cleanup.retentionDays can be overridden with a positive integer", () => {
  const cfg = createConfig({
    db: { url: "postgres://localhost/test" },
    cleanup: { retentionDays: 7 },
  });
  assertEquals(cfg.cleanup.retentionDays, 7);
});

Deno.test("cleanup.retentionDays fails validation with a non-positive integer", () => {
  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        cleanup: { retentionDays: 0 },
      }),
    ZodError,
  );

  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        cleanup: { retentionDays: -5 },
      }),
    ZodError,
  );
});
