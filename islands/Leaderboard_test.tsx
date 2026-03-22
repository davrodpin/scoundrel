/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import Leaderboard from "./Leaderboard.tsx";

Deno.test("Leaderboard - renders Buy me a coffee button", () => {
  const html = render(<Leaderboard />);
  assertEquals(html.includes("data-bmc-container"), true);
});
