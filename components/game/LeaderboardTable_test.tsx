/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { LeaderboardTable } from "./LeaderboardTable.tsx";

const entry = {
  gameId: "game-123",
  playerName: "Thorin",
  score: 15,
  createdAt: "2026-01-01T00:00:00Z",
  completedAt: "2026-01-01T01:00:00Z",
};

const entry2 = {
  gameId: "game-456",
  playerName: "Gandalf",
  score: 20,
  createdAt: "2026-01-02T00:00:00Z",
  completedAt: "2026-01-02T01:00:00Z",
};

Deno.test("LeaderboardTable - no dungeon link when showDungeonLink is false", () => {
  const html = render(
    <LeaderboardTable
      entries={[entry]}
      highlightGameId="game-123"
      showDungeonLink={false}
    />,
  );
  assertEquals(html.includes('/play/game-123"'), false);
});

Deno.test("LeaderboardTable - no dungeon link when showDungeonLink is omitted", () => {
  const html = render(
    <LeaderboardTable
      entries={[entry]}
      highlightGameId="game-123"
    />,
  );
  assertEquals(html.includes('/play/game-123"'), false);
});

Deno.test("LeaderboardTable - shows dungeon link for highlighted row when showDungeonLink is true", () => {
  const html = render(
    <LeaderboardTable
      entries={[entry]}
      highlightGameId="game-123"
      showDungeonLink
    />,
  );
  assertEquals(html.includes('href="/play/game-123"'), true);
});

Deno.test("LeaderboardTable - dungeon link not shown for non-highlighted rows", () => {
  const html = render(
    <LeaderboardTable
      entries={[entry, entry2]}
      highlightGameId="game-123"
      showDungeonLink
    />,
  );
  assertEquals(html.includes('href="/play/game-456"'), false);
});

Deno.test("LeaderboardTable - shows dungeon link for extraEntry when showDungeonLink is true", () => {
  const html = render(
    <LeaderboardTable
      entries={[entry2]}
      highlightGameId="game-123"
      extraEntry={{ entry, rank: 42 }}
      showDungeonLink
    />,
  );
  assertEquals(html.includes('href="/play/game-123"'), true);
});

Deno.test("LeaderboardTable - no dungeon link for extraEntry when showDungeonLink is false", () => {
  const html = render(
    <LeaderboardTable
      entries={[entry2]}
      highlightGameId="game-123"
      extraEntry={{ entry, rank: 42 }}
      showDungeonLink={false}
    />,
  );
  assertEquals(html.includes('href="/play/game-123"'), false);
});
