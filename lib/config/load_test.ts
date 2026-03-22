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
