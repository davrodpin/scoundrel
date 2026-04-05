function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = parseInt(value, 10);
  return isNaN(n) ? undefined : n;
}

function resolveMetricsPushSchedule(appEnv: string | undefined): string {
  const explicit = Deno.env.get("METRIC_PUSH_CRON_SCHEDULE");
  if (explicit) return explicit;

  switch (appEnv) {
    case "production":
      return "*/10 * * * *";
    default:
      return "* * * * *";
  }
}

export function loadConfigFromEnv(): unknown {
  const appEnv = Deno.env.get("APP_ENV");
  return {
    db: { url: Deno.env.get("DATABASE_URL") },
    app: {
      origin: Deno.env.get("APP_ORIGIN"),
      maxBodyBytes: parseOptionalInt(Deno.env.get("MAX_BODY_BYTES")),
      maxPlayerNameLength: parseOptionalInt(
        Deno.env.get("MAX_PLAYER_NAME_LENGTH"),
      ),
      env: appEnv,
    },
    game: {
      defaultPlayerName: Deno.env.get("DEFAULT_PLAYER_NAME"),
      leaderboardLimit: parseOptionalInt(Deno.env.get("LEADERBOARD_LIMIT")),
    },
    deploy: { id: Deno.env.get("DENO_DEPLOY_BUILD_ID") },
    cleanup: {
      retentionDays: parseOptionalInt(Deno.env.get("GAME_RETENTION_DAYS")),
    },
    feedback: Deno.env.get("TRELLO_API_KEY")
      ? {
        trelloApiKey: Deno.env.get("TRELLO_API_KEY"),
        trelloApiToken: Deno.env.get("TRELLO_API_TOKEN"),
        trelloListId: Deno.env.get("TRELLO_LIST_ID"),
        maxMessageLength: parseOptionalInt(
          Deno.env.get("FEEDBACK_MAX_MESSAGE_LENGTH"),
        ),
      }
      : undefined,
    grafana: Deno.env.get("GRAFANA_INSTANCE_ID")
      ? {
        instanceId: Deno.env.get("GRAFANA_INSTANCE_ID"),
        apiToken: Deno.env.get("GRAFANA_API_TOKEN"),
        endpoint: Deno.env.get("GRAFANA_OTLP_ENDPOINT"),
        metricsPushSchedule: resolveMetricsPushSchedule(appEnv),
      }
      : undefined,
  };
}
