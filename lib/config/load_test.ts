import { assertEquals } from "@std/assert";
import { loadConfigFromEnv } from "./load.ts";

const ALL_ENV_VARS = [
  "DATABASE_URL",
  "APP_ORIGIN",
  "MAX_BODY_BYTES",
  "MAX_PLAYER_NAME_LENGTH",
  "DEFAULT_PLAYER_NAME",
  "LEADERBOARD_LIMIT",
  "DENO_DEPLOYMENT_ID",
  "GAME_RETENTION_DAYS",
  "SCOUNDREL_GITHUB_TOKEN",
  "FEEDBACK_GITHUB_REPO",
  "FEEDBACK_GITHUB_LABEL",
  "FEEDBACK_MAX_MESSAGE_LENGTH",
  "APP_ENV",
  "GRAFANA_INSTANCE_ID",
  "GRAFANA_API_TOKEN",
  "GRAFANA_OTLP_ENDPOINT",
];

Deno.test(
  {
    name:
      "loadConfigFromEnv returns cleanup.retentionDays as undefined when GAME_RETENTION_DAYS is not set",
    permissions: { env: ALL_ENV_VARS },
  },
  () => {
    Deno.env.delete("GAME_RETENTION_DAYS");
    const raw = loadConfigFromEnv() as Record<string, unknown>;
    const cleanup = raw["cleanup"] as Record<string, unknown>;
    assertEquals(cleanup["retentionDays"], undefined);
  },
);

Deno.test(
  {
    name:
      "loadConfigFromEnv returns correct cleanup.retentionDays when GAME_RETENTION_DAYS=7",
    permissions: { env: ALL_ENV_VARS },
  },
  () => {
    Deno.env.set("GAME_RETENTION_DAYS", "7");
    try {
      const raw = loadConfigFromEnv() as Record<string, unknown>;
      const cleanup = raw["cleanup"] as Record<string, unknown>;
      assertEquals(cleanup["retentionDays"], 7);
    } finally {
      Deno.env.delete("GAME_RETENTION_DAYS");
    }
  },
);

Deno.test(
  {
    name:
      "loadConfigFromEnv returns app.env as undefined when APP_ENV is not set",
    permissions: { env: ALL_ENV_VARS },
  },
  () => {
    Deno.env.delete("APP_ENV");
    const raw = loadConfigFromEnv() as Record<string, unknown>;
    const app = raw["app"] as Record<string, unknown>;
    assertEquals(app["env"], undefined);
  },
);

Deno.test(
  {
    name: "loadConfigFromEnv returns app.env from APP_ENV",
    permissions: { env: ALL_ENV_VARS },
  },
  () => {
    Deno.env.set("APP_ENV", "production");
    try {
      const raw = loadConfigFromEnv() as Record<string, unknown>;
      const app = raw["app"] as Record<string, unknown>;
      assertEquals(app["env"], "production");
    } finally {
      Deno.env.delete("APP_ENV");
    }
  },
);

Deno.test(
  {
    name:
      "loadConfigFromEnv returns grafana as undefined when GRAFANA_INSTANCE_ID is not set",
    permissions: { env: ALL_ENV_VARS },
  },
  () => {
    Deno.env.delete("GRAFANA_INSTANCE_ID");
    Deno.env.delete("GRAFANA_API_TOKEN");
    const raw = loadConfigFromEnv() as Record<string, unknown>;
    assertEquals(raw["grafana"], undefined);
  },
);

Deno.test(
  {
    name:
      "loadConfigFromEnv returns grafana config when all GRAFANA_* vars are set",
    permissions: { env: ALL_ENV_VARS },
  },
  () => {
    Deno.env.set("GRAFANA_INSTANCE_ID", "123456");
    Deno.env.set("GRAFANA_API_TOKEN", "glc_abc");
    Deno.env.set(
      "GRAFANA_OTLP_ENDPOINT",
      "https://otlp.grafana.net/otlp",
    );
    try {
      const raw = loadConfigFromEnv() as Record<string, unknown>;
      const grafana = raw["grafana"] as Record<string, unknown>;
      assertEquals(grafana["instanceId"], "123456");
      assertEquals(grafana["apiToken"], "glc_abc");
      assertEquals(grafana["endpoint"], "https://otlp.grafana.net/otlp");
    } finally {
      Deno.env.delete("GRAFANA_INSTANCE_ID");
      Deno.env.delete("GRAFANA_API_TOKEN");
      Deno.env.delete("GRAFANA_OTLP_ENDPOINT");
    }
  },
);
