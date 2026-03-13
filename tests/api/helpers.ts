// HTTP helpers for API-level integration tests.
// Requires BASE_URL to be set in the environment.

export function getBaseUrl(): string {
  const url = Deno.env.get("BASE_URL");
  if (!url) {
    throw new Error(
      "BASE_URL environment variable is required for integration tests",
    );
  }
  return url.replace(/\/$/, "");
}

export function api(path: string): string {
  return `${getBaseUrl()}${path}`;
}

export async function createGame(playerName: string): Promise<Response> {
  return await fetch(api("/api/games"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
}

export async function submitAction(
  gameId: string,
  action: unknown,
): Promise<Response> {
  return await fetch(api(`/api/games/${gameId}/actions`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
}

export async function getGame(gameId: string): Promise<Response> {
  return await fetch(api(`/api/games/${gameId}`));
}

export async function getEventLog(gameId: string): Promise<Response> {
  return await fetch(api(`/api/games/${gameId}/events`));
}

export async function getLeaderboard(gameId?: string): Promise<Response> {
  const url = gameId
    ? api(`/api/leaderboard?gameId=${encodeURIComponent(gameId)}`)
    : api("/api/leaderboard");
  return await fetch(url);
}
