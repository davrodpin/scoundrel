// Integration tests for the full game lifecycle via HTTP API.
// Requires BASE_URL to be set in the environment.

import { assert, assertEquals, assertExists } from "@std/assert";
import {
  createGame,
  getEventLog,
  getGame,
  getLeaderboard,
  submitAction,
} from "./helpers.ts";

type GameView = {
  gameId: string;
  playerName: string;
  health: number;
  dungeonCount: number;
  room: Array<{ suit: string; rank: number }>;
  phase: { kind: string };
  score: number | null;
};

Deno.test("game lifecycle — create game returns 201 with initial state", async () => {
  const res = await createGame("LifecycleTester");
  assertEquals(res.status, 201);

  const view = await res.json() as GameView;
  assertExists(view.gameId);
  assertEquals(view.phase.kind, "drawing");
  assertEquals(view.health, 20);
  assertEquals(view.dungeonCount, 44);
});

Deno.test("game lifecycle — drawing cards transitions to room_ready", async () => {
  const createRes = await createGame("DrawTester");
  assertEquals(createRes.status, 201);
  let view = await createRes.json() as GameView;
  assertEquals(view.phase.kind, "drawing");

  const gameId = view.gameId;

  // Draw cards until room is ready
  while (view.phase.kind === "drawing") {
    const r = await submitAction(gameId, { type: "draw_card" });
    assertEquals(r.status, 200);
    view = await r.json() as GameView;
  }

  assertEquals(view.phase.kind, "room_ready");
  assertEquals(view.room.length, 4);
});

Deno.test("game lifecycle — choosing cards transitions through choosing and back to drawing", async () => {
  const createRes = await createGame("ChooseTester");
  assertEquals(createRes.status, 201);
  let view = await createRes.json() as GameView;
  const gameId = view.gameId;

  // Draw to room_ready
  while (view.phase.kind === "drawing") {
    const r = await submitAction(gameId, { type: "draw_card" });
    assertEquals(r.status, 200);
    view = await r.json() as GameView;
  }
  assertEquals(view.phase.kind, "room_ready");

  // First choose_card from room_ready triggers auto-enter_room then choose_card
  const firstChoose = await submitAction(gameId, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(firstChoose.status, 200);
  view = await firstChoose.json() as GameView;
  assertEquals(view.phase.kind, "choosing");

  // Choose remaining cards until not in choosing phase
  while (view.phase.kind === "choosing") {
    const r = await submitAction(gameId, {
      type: "choose_card",
      cardIndex: 0,
      fightWith: "barehanded",
    });
    assertEquals(r.status, 200);
    view = await r.json() as GameView;
  }

  // After 3 choices, should be back to drawing (unless game over)
  assert(
    view.phase.kind === "drawing" || view.phase.kind === "game_over",
    `Expected drawing or game_over, got ${view.phase.kind}`,
  );
});

Deno.test("game lifecycle — play through entire game until game_over", async () => {
  const createRes = await createGame("FullGameTester");
  assertEquals(createRes.status, 201);
  let view = await createRes.json() as GameView;
  const gameId = view.gameId;

  // Play through the entire game
  let iterations = 0;
  const maxIterations = 500;

  while (view.phase.kind !== "game_over" && iterations < maxIterations) {
    iterations++;

    let action: Record<string, unknown>;
    if (view.phase.kind === "drawing") {
      action = { type: "draw_card" };
    } else {
      // room_ready or choosing: choose card at index 0
      action = { type: "choose_card", cardIndex: 0, fightWith: "barehanded" };
    }

    const r = await submitAction(gameId, action);
    assertEquals(r.status, 200);
    view = await r.json() as GameView;
  }

  assert(
    view.phase.kind === "game_over",
    `Game did not reach game_over after ${iterations} iterations`,
  );
  assertExists(view.score, "Score should be populated after game_over");
});

Deno.test("game lifecycle — event log is available for completed game", async () => {
  // Play through a full game first
  const createRes = await createGame("EventLogTester");
  assertEquals(createRes.status, 201);
  let view = await createRes.json() as GameView;
  const gameId = view.gameId;

  let iterations = 0;
  while (view.phase.kind !== "game_over" && iterations < 500) {
    iterations++;
    const action: Record<string, unknown> = view.phase.kind === "drawing"
      ? { type: "draw_card" }
      : { type: "choose_card", cardIndex: 0, fightWith: "barehanded" };
    const r = await submitAction(gameId, action);
    assertEquals(r.status, 200);
    view = await r.json() as GameView;
  }
  assertEquals(view.phase.kind, "game_over");

  // Verify event log
  const eventLogRes = await getEventLog(gameId);
  assertEquals(eventLogRes.status, 200);

  const eventLog = await eventLogRes.json() as {
    gameId: string;
    events: unknown[];
  };
  assertEquals(eventLog.gameId, gameId);
  assert(eventLog.events.length > 0, "Event log should be non-empty");
});

Deno.test("game lifecycle — completed game appears in leaderboard", async () => {
  // Play through a full game
  const createRes = await createGame("LeaderboardTester");
  assertEquals(createRes.status, 201);
  let view = await createRes.json() as GameView;
  const gameId = view.gameId;

  let iterations = 0;
  while (view.phase.kind !== "game_over" && iterations < 500) {
    iterations++;
    const action: Record<string, unknown> = view.phase.kind === "drawing"
      ? { type: "draw_card" }
      : { type: "choose_card", cardIndex: 0, fightWith: "barehanded" };
    const r = await submitAction(gameId, action);
    assertEquals(r.status, 200);
    view = await r.json() as GameView;
  }
  assertEquals(view.phase.kind, "game_over");

  // Verify game appears in leaderboard
  const leaderboardRes = await getLeaderboard();
  assertEquals(leaderboardRes.status, 200);

  const leaderboard = await leaderboardRes.json() as Array<{ gameId: string }>;
  assert(Array.isArray(leaderboard));
  assert(
    leaderboard.some((entry) => entry.gameId === gameId),
    "Completed game should appear in leaderboard",
  );
});

Deno.test("game lifecycle — getGame returns current state", async () => {
  const createRes = await createGame("GetGameTester");
  assertEquals(createRes.status, 201);
  const created = await createRes.json() as GameView;
  const gameId = created.gameId;

  const getRes = await getGame(gameId);
  assertEquals(getRes.status, 200);

  const fetched = await getRes.json() as GameView;
  assertEquals(fetched.gameId, gameId);
  assertEquals(fetched.phase.kind, "drawing");
  assertEquals(fetched.health, 20);
});
