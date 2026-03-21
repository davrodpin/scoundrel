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

Deno.test("HowToPlay - weapon degradation section clarifies barehanded is always an option", () => {
  const html = render(<HowToPlay />);
  assertEquals(
    html.includes("always choose to fight barehanded"),
    true,
    "Weapon degradation section should clarify that fighting barehanded is always an option",
  );
});

Deno.test("HowToPlay - section headings render anchor links for all 11 sections", () => {
  const html = render(<HowToPlay />);
  const anchors = [
    "#overview",
    "#setup",
    "#card-types",
    "#turn-flow",
    "#combat",
    "#weapon-degradation",
    "#health-potions",
    "#room-avoidance",
    "#game-interface",
    "#keyboard-shortcuts",
    "#scoring",
  ];
  for (const anchor of anchors) {
    assertEquals(
      html.includes(`href="${anchor}"`),
      true,
      `Missing anchor link for ${anchor}`,
    );
  }
});
