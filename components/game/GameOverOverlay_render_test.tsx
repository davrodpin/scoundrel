/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { GameOverOverlay } from "./GameOverOverlay.tsx";

const noop = () => {};

Deno.test("GameOverOverlay - renders Buy me a coffee button", () => {
  const html = render(
    <GameOverOverlay
      reason="dead"
      score={-10}
      onNewGame={noop}
    />,
  );
  assertEquals(html.includes("data-bmc-container"), true);
});
