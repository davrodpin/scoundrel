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
    },
    game: {
      defaultPlayerName: Deno.env.get("DEFAULT_PLAYER_NAME"),
    },
    deploy: { id: Deno.env.get("DENO_DEPLOYMENT_ID") },
    cleanup: {
      retentionDays: parseOptionalInt(Deno.env.get("GAME_RETENTION_DAYS")),
    },
  };
}
