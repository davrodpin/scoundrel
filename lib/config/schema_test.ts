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
  assertEquals(cfg.app.origin, "https://scoundrel.deno.dev");
  assertEquals(cfg.app.maxBodyBytes, 4096);
  assertEquals(cfg.app.maxPlayerNameLength, 30);
  assertEquals(cfg.game.defaultPlayerName, "Anonymous");
  assertEquals(cfg.game.leaderboardLimit, 25);
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
