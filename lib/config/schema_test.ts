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

Deno.test("app.env defaults to 'local' when not provided", () => {
  const cfg = createConfig({ db: { url: "postgres://localhost/test" } });
  assertEquals(cfg.app.env, "local");
});

Deno.test("app.env accepts 'production'", () => {
  const cfg = createConfig({
    db: { url: "postgres://localhost/test" },
    app: { env: "production" },
  });
  assertEquals(cfg.app.env, "production");
});

Deno.test("app.env accepts 'test'", () => {
  const cfg = createConfig({
    db: { url: "postgres://localhost/test" },
    app: { env: "test" },
  });
  assertEquals(cfg.app.env, "test");
});

Deno.test("app.env rejects invalid values", () => {
  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        app: { env: "staging" },
      }),
    ZodError,
  );
});

Deno.test("grafana config is absent when not provided", () => {
  const cfg = createConfig({ db: { url: "postgres://localhost/test" } });
  assertEquals(cfg.grafana, undefined);
});

Deno.test("grafana config parses instanceId, apiToken, endpoint, and metricsPushSchedule", () => {
  const cfg = createConfig({
    db: { url: "postgres://localhost/test" },
    grafana: {
      instanceId: "123456",
      apiToken: "glc_abc",
      endpoint: "https://otlp.grafana.net/otlp",
      metricsPushSchedule: "*/10 * * * *",
    },
  });
  assertEquals(cfg.grafana?.instanceId, "123456");
  assertEquals(cfg.grafana?.apiToken, "glc_abc");
  assertEquals(cfg.grafana?.endpoint, "https://otlp.grafana.net/otlp");
  assertEquals(cfg.grafana?.metricsPushSchedule, "*/10 * * * *");
});

Deno.test("grafana config rejects missing metricsPushSchedule", () => {
  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        grafana: {
          instanceId: "123456",
          apiToken: "glc_abc",
          endpoint: "https://otlp.grafana.net/otlp",
        },
      }),
    ZodError,
  );
});

Deno.test("grafana config rejects empty metricsPushSchedule", () => {
  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        grafana: {
          instanceId: "123456",
          apiToken: "glc_abc",
          endpoint: "https://otlp.grafana.net/otlp",
          metricsPushSchedule: "",
        },
      }),
    ZodError,
  );
});

Deno.test("grafana config rejects empty instanceId", () => {
  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        grafana: {
          instanceId: "",
          apiToken: "glc_abc",
          endpoint: "https://otlp.grafana.net/otlp",
          metricsPushSchedule: "*/10 * * * *",
        },
      }),
    ZodError,
  );
});

Deno.test("grafana config parses endpoint as a URL", () => {
  const cfg = createConfig({
    db: { url: "postgres://localhost/test" },
    grafana: {
      instanceId: "123456",
      apiToken: "glc_abc",
      endpoint: "https://otlp-gateway-prod-us-east-0.grafana.net/otlp",
      metricsPushSchedule: "*/10 * * * *",
    },
  });
  assertEquals(
    cfg.grafana?.endpoint,
    "https://otlp-gateway-prod-us-east-0.grafana.net/otlp",
  );
});

Deno.test("grafana config rejects non-URL endpoint", () => {
  assertThrows(
    () =>
      createConfig({
        db: { url: "postgres://localhost/test" },
        grafana: {
          instanceId: "123456",
          apiToken: "glc_abc",
          endpoint: "not-a-url",
          metricsPushSchedule: "*/10 * * * *",
        },
      }),
    ZodError,
  );
});
