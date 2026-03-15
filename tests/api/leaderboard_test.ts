// Integration tests for the leaderboard API endpoint.
// Requires BASE_URL to be set in the environment.

import { assert, assertEquals, assertExists } from "@std/assert";
import { createGame, getLeaderboard, playGameToCompletion } from "./helpers.ts";

type LeaderboardEntry = {
  gameId: string;
  playerName: string;
  score: number;
  completedAt: string;
};

type LeaderboardRank = {
  entry: LeaderboardEntry;
  rank: number;
  topPercent: number;
};

type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  playerRank: LeaderboardRank | null;
};

Deno.test(
  "leaderboard — invalid gameId returns entries with null playerRank",
  async () => {
    const res = await getLeaderboard("not-a-valid-uuid");
    assertEquals(res.status, 200);

    const body = await res.json() as LeaderboardResponse;
    assert(Array.isArray(body.entries), "entries should be an array");
    assertEquals(body.playerRank, null);
  },
);

Deno.test(
  "leaderboard — non-existent gameId returns entries with null playerRank",
  async () => {
    const res = await getLeaderboard(crypto.randomUUID());
    assertEquals(res.status, 200);

    const body = await res.json() as LeaderboardResponse;
    assert(Array.isArray(body.entries), "entries should be an array");
    assertEquals(body.playerRank, null);
  },
);

Deno.test(
  "leaderboard — in-progress game returns entries with null playerRank",
  async () => {
    const createRes = await createGame("LbInProgress");
    assertEquals(createRes.status, 201);
    const view = await createRes.json() as { gameId: string };
    const gameId = view.gameId;

    const res = await getLeaderboard(gameId);
    assertEquals(res.status, 200);

    const body = await res.json() as LeaderboardResponse;
    assert(Array.isArray(body.entries), "entries should be an array");
    assertEquals(body.playerRank, null);
    assert(
      !body.entries.some((e) => e.gameId === gameId),
      "In-progress game should not appear in entries",
    );
  },
);

Deno.test(
  "leaderboard — completed game returns entries with rank data",
  async () => {
    const view = await playGameToCompletion("LbCompleted");
    const gameId = view.gameId;

    const res = await getLeaderboard(gameId);
    assertEquals(res.status, 200);

    const body = await res.json() as LeaderboardResponse;
    assert(Array.isArray(body.entries), "entries should be an array");
    assertExists(
      body.playerRank,
      "playerRank should be present for completed game",
    );

    const { entry, rank, topPercent } = body.playerRank;
    assertEquals(entry.gameId, gameId);
    assertEquals(entry.playerName, "LbCompleted");
    assertEquals(typeof entry.score, "number");
    assertEquals(typeof entry.completedAt, "string");
    assert(rank >= 1, `rank ${rank} should be >= 1`);
    assert(
      topPercent >= 1 && topPercent <= 100,
      `topPercent ${topPercent} should be between 1 and 100`,
    );

    // Scenario 3: rank <= 100 → game appears in entries list at that position
    // Scenario 4: rank > 100 → game not in entries list (list capped at 100)
    const position = body.entries.findIndex((e) => e.gameId === gameId) + 1;
    if (rank <= 100) {
      assertEquals(
        position,
        rank,
        `Rank ${rank} should match list position ${position}`,
      );
    } else {
      assertEquals(
        position,
        0,
        `Game ranked ${rank} (>100) should not appear in entries list`,
      );
    }
  },
);
