/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { GameSection } from "./GameSection.tsx";

Deno.test("GameSection - uses responsive padding classes", () => {
  const html = render(
    <GameSection label="Room">
      <div>content</div>
    </GameSection>,
  );
  assertEquals(html.includes("px-3"), true);
  assertEquals(html.includes("py-2"), true);
  assertEquals(html.includes("md:px-6"), true);
  assertEquals(html.includes("md:py-5"), true);
});

Deno.test("GameSection - centers content with items-center", () => {
  const html = render(
    <GameSection label="Room">
      <div>content</div>
    </GameSection>,
  );
  assertEquals(html.includes("items-center"), true);
});

Deno.test("GameSection - uses responsive label text size", () => {
  const html = render(
    <GameSection label="Room">
      <div>content</div>
    </GameSection>,
  );
  assertEquals(html.includes("text-[10px]"), true);
  assertEquals(html.includes("md:text-xs"), true);
});
