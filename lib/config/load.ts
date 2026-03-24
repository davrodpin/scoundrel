function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = parseInt(value, 10);
  return isNaN(n) ? undefined : n;
}

export function loadConfigFromEnv(): unknown {
  return {
    db: { url: Deno.env.get("DATABASE_URL") },
    app: {
      origin: Deno.env.get("APP_ORIGIN"),
      maxBodyBytes: parseOptionalInt(Deno.env.get("MAX_BODY_BYTES")),
      maxPlayerNameLength: parseOptionalInt(
        Deno.env.get("MAX_PLAYER_NAME_LENGTH"),
      ),
      env: Deno.env.get("APP_ENV"),
    },
    game: {
      defaultPlayerName: Deno.env.get("DEFAULT_PLAYER_NAME"),
      leaderboardLimit: parseOptionalInt(Deno.env.get("LEADERBOARD_LIMIT")),
    },
    deploy: { id: Deno.env.get("DENO_DEPLOYMENT_ID") },
    cleanup: {
      retentionDays: parseOptionalInt(Deno.env.get("GAME_RETENTION_DAYS")),
    },
    feedback: Deno.env.get("SCOUNDREL_GITHUB_TOKEN")
      ? {
        githubToken: Deno.env.get("SCOUNDREL_GITHUB_TOKEN"),
        githubRepo: Deno.env.get("FEEDBACK_GITHUB_REPO"),
        githubLabel: Deno.env.get("FEEDBACK_GITHUB_LABEL"),
        maxMessageLength: parseOptionalInt(
          Deno.env.get("FEEDBACK_MAX_MESSAGE_LENGTH"),
        ),
      }
      : undefined,
    grafana: Deno.env.get("GRAFANA_INSTANCE_ID")
      ? {
        instanceId: Deno.env.get("GRAFANA_INSTANCE_ID"),
        apiToken: Deno.env.get("GRAFANA_API_TOKEN"),
      }
      : undefined,
  };
}
