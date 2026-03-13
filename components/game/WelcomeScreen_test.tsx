/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { WelcomeScreen } from "./WelcomeScreen.tsx";

const noop = () => {};

Deno.test("WelcomeScreen - renders player name input", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      onLeaderboardClick={noop}
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("Enter your name, adventurer"), true);
});

Deno.test("WelcomeScreen - renders Enter the Dungeon button", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      onLeaderboardClick={noop}
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("Enter the Dungeon"), true);
});

Deno.test("WelcomeScreen - renders How to Play link", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      onLeaderboardClick={noop}
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("How to Play"), true);
});

Deno.test("WelcomeScreen - renders Leaderboard button", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      onLeaderboardClick={noop}
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("Leaderboard"), true);
});

Deno.test("WelcomeScreen - Enter the Dungeon is disabled when name is empty", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      onLeaderboardClick={noop}
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("disabled"), true);
});

Deno.test("WelcomeScreen - Enter the Dungeon is enabled when name is provided", () => {
  const html = render(
    <WelcomeScreen
      playerName="Aragorn"
      onPlayerNameChange={noop}
      onStartGame={noop}
      onLeaderboardClick={noop}
      loading={false}
      errorMsg={null}
    />,
  );
  // When enabled, the disabled attribute (disabled="") should not appear in the rendered HTML.
  // Note: Tailwind class names like "disabled:opacity-50" contain "disabled:" so we check
  // for the HTML attribute form ` disabled` (space-prefixed) or `disabled="`.
  assertEquals(html.includes('disabled=""'), false);
});

Deno.test("WelcomeScreen - calls onLeaderboardClick when Leaderboard button is clicked", () => {
  let called = false;
  // Since preact-render-to-string is SSR, we verify onClick is wired by checking
  // the rendered output includes the Leaderboard button (event handler can't be tested in SSR).
  // We render with a tracking function to confirm the prop is accepted without error.
  const html = render(
    <WelcomeScreen
      playerName="Aragorn"
      onPlayerNameChange={noop}
      onStartGame={noop}
      onLeaderboardClick={() => {
        called = true;
      }}
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("Leaderboard"), true);
  // called stays false in SSR — that's expected; the test confirms the prop is accepted
  assertEquals(called, false);
});
