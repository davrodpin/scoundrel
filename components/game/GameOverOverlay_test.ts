import { assertEquals } from "@std/assert";
import { getLeaderboardPositionText } from "./GameOverOverlay.tsx";

Deno.test("returns near the top label for 1%", () => {
  assertEquals(
    getLeaderboardPositionText(1),
    "Near the top of the Leaderboard (top 1%)",
  );
});

Deno.test("returns near the top label for 10%", () => {
  assertEquals(
    getLeaderboardPositionText(10),
    "Near the top of the Leaderboard (top 10%)",
  );
});

Deno.test("returns upper ranks label for 11%", () => {
  assertEquals(
    getLeaderboardPositionText(11),
    "In the upper ranks of the Leaderboard (top 11%)",
  );
});

Deno.test("returns upper ranks label for 25%", () => {
  assertEquals(
    getLeaderboardPositionText(25),
    "In the upper ranks of the Leaderboard (top 25%)",
  );
});

Deno.test("returns upper half label for 26%", () => {
  assertEquals(
    getLeaderboardPositionText(26),
    "In the upper half of the Leaderboard (top 26%)",
  );
});

Deno.test("returns upper half label for 50%", () => {
  assertEquals(
    getLeaderboardPositionText(50),
    "In the upper half of the Leaderboard (top 50%)",
  );
});

Deno.test("returns lower half label for 51%", () => {
  assertEquals(
    getLeaderboardPositionText(51),
    "In the lower half of the Leaderboard (top 51%)",
  );
});

Deno.test("returns lower half label for 75%", () => {
  assertEquals(
    getLeaderboardPositionText(75),
    "In the lower half of the Leaderboard (top 75%)",
  );
});

Deno.test("returns near the bottom label for 76%", () => {
  assertEquals(
    getLeaderboardPositionText(76),
    "Near the bottom of the Leaderboard (top 76%)",
  );
});

Deno.test("returns near the bottom label for 90%", () => {
  assertEquals(
    getLeaderboardPositionText(90),
    "Near the bottom of the Leaderboard (top 90%)",
  );
});

Deno.test("returns close to the bottom label for 91%", () => {
  assertEquals(
    getLeaderboardPositionText(91),
    "Close to the bottom of the Leaderboard (top 91%)",
  );
});

Deno.test("returns close to the bottom label for 100%", () => {
  assertEquals(
    getLeaderboardPositionText(100),
    "Close to the bottom of the Leaderboard (top 100%)",
  );
});
