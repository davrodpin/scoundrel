// HTTP helpers for API-level integration tests.
// Requires BASE_URL to be set in the environment.

export type GameView = {
  gameId: string;
  playerName: string;
  health: number;
  dungeonCount: number;
  room: Array<{ suit: string; rank: number }>;
  phase: { kind: string };
  score: number | null;
};

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

export async function playGameToCompletion(
  playerName: string,
): Promise<GameView> {
  const createRes = await createGame(playerName);
  if (createRes.status !== 201) {
    throw new Error(
      `createGame failed with status ${createRes.status} for player ${playerName}`,
    );
  }
  let view = await createRes.json() as GameView;
  const gameId = view.gameId;

  let iterations = 0;
  const maxIterations = 500;
  while (view.phase.kind !== "game_over" && iterations < maxIterations) {
    iterations++;
    const action: Record<string, unknown> = view.phase.kind === "drawing"
      ? { type: "draw_card" }
      : { type: "choose_card", cardIndex: 0, fightWith: "barehanded" };
    const r = await submitAction(gameId, action);
    if (r.status !== 200) {
      throw new Error(
        `submitAction failed with status ${r.status} at iteration ${iterations}`,
      );
    }
    view = await r.json() as GameView;
  }

  if (view.phase.kind !== "game_over") {
    throw new Error(
      `Game did not reach game_over after ${maxIterations} iterations`,
    );
  }
  return view;
}
