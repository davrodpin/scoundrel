import { assertEquals } from "@std/assert";
import { filterLeaderboardEntries } from "./leaderboard_search_utils.ts";
import type { LeaderboardEntry } from "@scoundrel/game-service";

const ENTRIES: LeaderboardEntry[] = [
  {
    gameId: "a1",
    playerName: "Aragorn",
    score: 15,
    completedAt: "2026-03-01T00:00:00Z",
  },
  {
    gameId: "b2",
    playerName: "Bilbo",
    score: 10,
    completedAt: "2026-03-02T00:00:00Z",
  },
  {
    gameId: "c3",
    playerName: "Celeborn",
    score: 5,
    completedAt: "2026-03-03T00:00:00Z",
  },
  {
    gameId: "d4",
    playerName: "Arwen",
    score: -3,
    completedAt: "2026-03-04T00:00:00Z",
  },
];

Deno.test("filterLeaderboardEntries — returns all entries with ranks when query is empty", () => {
  const result = filterLeaderboardEntries(ENTRIES, "");
  assertEquals(result.length, 4);
  assertEquals(result[0].rank, 1);
  assertEquals(result[0].entry.playerName, "Aragorn");
  assertEquals(result[3].rank, 4);
  assertEquals(result[3].entry.playerName, "Arwen");
});

Deno.test("filterLeaderboardEntries — returns all entries when query is whitespace", () => {
  const result = filterLeaderboardEntries(ENTRIES, "   ");
  assertEquals(result.length, 4);
});

Deno.test("filterLeaderboardEntries — filters by case-insensitive substring and preserves original ranks", () => {
  const result = filterLeaderboardEntries(ENTRIES, "ar");
  assertEquals(result.length, 2);
  assertEquals(result[0].entry.playerName, "Aragorn");
  assertEquals(result[0].rank, 1);
  assertEquals(result[1].entry.playerName, "Arwen");
  assertEquals(result[1].rank, 4);
});

Deno.test("filterLeaderboardEntries — returns empty array when no matches", () => {
  const result = filterLeaderboardEntries(ENTRIES, "Gandalf");
  assertEquals(result.length, 0);
});

Deno.test("filterLeaderboardEntries — matches exact name case-insensitively", () => {
  const result = filterLeaderboardEntries(ENTRIES, "bilbo");
  assertEquals(result.length, 1);
  assertEquals(result[0].entry.playerName, "Bilbo");
  assertEquals(result[0].rank, 2);
});
