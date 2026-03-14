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
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("How to Play"), true);
});

Deno.test("WelcomeScreen - renders Show Leaderboard link", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      loading={false}
      errorMsg={null}
    />,
  );
  assertEquals(html.includes("Show Leaderboard"), true);
  assertEquals(html.includes('href="/leaderboard"'), true);
});

Deno.test("WelcomeScreen - Enter the Dungeon is disabled when name is empty", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
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
      loading={false}
      errorMsg={null}
    />,
  );
  // When enabled, the disabled attribute (disabled="") should not appear in the rendered HTML.
  // Note: Tailwind class names like "disabled:opacity-50" contain "disabled:" so we check
  // for the HTML attribute form ` disabled` (space-prefixed) or `disabled="`.
  assertEquals(html.includes('disabled=""'), false);
});
