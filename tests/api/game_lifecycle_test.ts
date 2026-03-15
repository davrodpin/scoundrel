// Integration tests for the full game lifecycle via HTTP API.
// Requires BASE_URL to be set in the environment.

import { assert, assertEquals, assertExists } from "@std/assert";
import {
  createGame,
  type GameView,
  getEventLog,
  getGame,
  getLeaderboard,
  submitAction,
} from "./helpers.ts";

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
  const createRes = await createGame("LeaderboardTest");
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

  // Verify game has a leaderboard entry via the rank endpoint
  const rankRes = await getLeaderboard(gameId);
  assertEquals(rankRes.status, 200);

  const leaderboard = await rankRes.json() as {
    entries: Array<{ gameId: string }>;
    playerRank: { entry: { gameId: string }; rank: number } | null;
  };
  assert(Array.isArray(leaderboard.entries));
  assertExists(
    leaderboard.playerRank,
    "Completed game should have a leaderboard entry",
  );
  assertEquals(
    leaderboard.playerRank.entry.gameId,
    gameId,
    "Leaderboard entry should match the completed game",
  );
});

Deno.test("game lifecycle — leaderboard rank matches list position for completed game", async () => {
  // Play a full game to completion
  const createRes = await createGame("RankPosTester");
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

  // Get rank for this game (combined response includes both)
  const rankRes = await getLeaderboard(gameId);
  assertEquals(rankRes.status, 200);
  const rankData = await rankRes.json() as {
    entries: Array<{ gameId: string }>;
    playerRank: { rank: number } | null;
  };
  assert(Array.isArray(rankData.entries));
  assert(rankData.playerRank !== null, "Completed game should have a rank");
  assert(rankData.playerRank.rank >= 1, "Rank should be a positive integer");

  // If rank <= 100, game must appear in entries at that position.
  // If rank > 100, game must not appear in entries (list is capped at 100).
  const position =
    rankData.entries.findIndex((entry) => entry.gameId === gameId) + 1;
  if (rankData.playerRank.rank <= 100) {
    assertEquals(
      position,
      rankData.playerRank.rank,
      `Rank ${rankData.playerRank.rank} should match list position ${position}`,
    );
  } else {
    assertEquals(
      position,
      0,
      `Game ranked ${rankData.playerRank.rank} (>100) should not appear in entries`,
    );
  }
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
