/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { WelcomeScreen } from "./WelcomeScreen.tsx";

const noop = () => {};

const defaultDeckProps = {
  decks: [],
  selectedDeckId: "classic",
  onDeckChange: noop,
  decksLoading: false,
};

Deno.test("WelcomeScreen - renders player name input", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      loading={false}
      errorMsg={null}
      {...defaultDeckProps}
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
      {...defaultDeckProps}
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
      {...defaultDeckProps}
    />,
  );
  assertEquals(html.includes("How to Play"), true);
});

Deno.test("WelcomeScreen - renders The Gravekeeper's Ledger link", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      loading={false}
      errorMsg={null}
      {...defaultDeckProps}
    />,
  );
  assertEquals(html.includes("Gravekeeper"), true);
  assertEquals(html.includes("Ledger"), true);
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
      {...defaultDeckProps}
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
      {...defaultDeckProps}
    />,
  );
  // When enabled, the disabled attribute (disabled="") should not appear in the rendered HTML.
  // Note: Tailwind class names like "disabled:opacity-50" contain "disabled:" so we check
  // for the HTML attribute form ` disabled` (space-prefixed) or `disabled="`.
  assertEquals(html.includes('disabled=""'), false);
});

Deno.test("WelcomeScreen - deck selector hidden when only one deck", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      loading={false}
      errorMsg={null}
      decks={[{
        id: "classic",
        name: "Classic",
        basePath: "/decks/classic",
        cards: {},
      }]}
      selectedDeckId="classic"
      onDeckChange={noop}
      decksLoading={false}
    />,
  );
  assertEquals(html.includes("<select"), false);
});

Deno.test("WelcomeScreen - deck selector shown when multiple decks", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      loading={false}
      errorMsg={null}
      decks={[
        {
          id: "classic",
          name: "Classic",
          basePath: "/decks/classic",
          cards: {},
        },
        { id: "modern", name: "Modern", basePath: "/decks/modern", cards: {} },
      ]}
      selectedDeckId="classic"
      onDeckChange={noop}
      decksLoading={false}
    />,
  );
  assertEquals(html.includes("<select"), true);
  assertEquals(html.includes("Classic"), true);
  assertEquals(html.includes("Modern"), true);
});

Deno.test("WelcomeScreen - deck selector has focus ring classes when multiple decks", () => {
  const html = render(
    <WelcomeScreen
      playerName=""
      onPlayerNameChange={noop}
      onStartGame={noop}
      loading={false}
      errorMsg={null}
      decks={[
        {
          id: "classic",
          name: "Classic",
          basePath: "/decks/classic",
          cards: {},
        },
        { id: "modern", name: "Modern", basePath: "/decks/modern", cards: {} },
      ]}
      selectedDeckId="classic"
      onDeckChange={noop}
      decksLoading={false}
    />,
  );
  assertEquals(html.includes("focus:ring-1"), true);
  assertEquals(html.includes("focus:ring-torch-amber/50"), true);
});
