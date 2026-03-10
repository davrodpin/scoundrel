/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import HowToPlay from "./HowToPlay.tsx";

Deno.test("HowToPlay - standalone shows Back to Game link and footer CTA", () => {
  const html = render(<HowToPlay />);
  assertEquals(html.includes("Back to Game"), true);
  assertEquals(html.includes("Enter the Dungeon"), true);
});

Deno.test("HowToPlay - embedded hides Back to Game link", () => {
  const html = render(<HowToPlay embedded />);
  assertEquals(html.includes("Back to Game"), false);
});

Deno.test("HowToPlay - embedded hides Enter the Dungeon footer CTA", () => {
  const html = render(<HowToPlay embedded />);
  assertEquals(html.includes("Enter the Dungeon"), false);
});

Deno.test("HowToPlay - embedded still shows main content", () => {
  const html = render(<HowToPlay embedded />);
  assertEquals(html.includes("Overview"), true);
  assertEquals(html.includes("Card Types"), true);
  assertEquals(html.includes("Combat"), true);
});
