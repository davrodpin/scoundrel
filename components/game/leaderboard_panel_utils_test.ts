import { assertEquals } from "@std/assert";
import { getLeaderboardStatusMessage } from "./leaderboard_panel_utils.ts";

Deno.test("returns loading message while loading", () => {
  assertEquals(
    getLeaderboardStatusMessage(true, 0),
    "Opening the Gravekeeper's Ledger...",
  );
});

Deno.test("returns loading message while loading even with entries", () => {
  assertEquals(
    getLeaderboardStatusMessage(true, 5),
    "Opening the Gravekeeper's Ledger...",
  );
});

Deno.test("returns empty message when not loading and no entries", () => {
  assertEquals(
    getLeaderboardStatusMessage(false, 0),
    "No completed games yet. Be the first to conquer the dungeon.",
  );
});

Deno.test("returns null when not loading and has entries", () => {
  assertEquals(getLeaderboardStatusMessage(false, 3), null);
});
