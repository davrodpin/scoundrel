/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { LoadingScreen } from "./LoadingScreen.tsx";

Deno.test("LoadingScreen — renders 'Preparing the Dungeon...' heading", () => {
  const html = render(<LoadingScreen loaded={0} total={45} />);
  assertEquals(html.includes("Preparing the Dungeon..."), true);
});

Deno.test("LoadingScreen — renders progress counter with loaded and total", () => {
  const html = render(<LoadingScreen loaded={23} total={45} />);
  assertEquals(html.includes("23"), true);
  assertEquals(html.includes("45"), true);
});

Deno.test("LoadingScreen — progress bar width reflects percentage", () => {
  // 23/46 = 50%
  const html = render(<LoadingScreen loaded={23} total={46} />);
  assertEquals(html.includes("50%"), true);
});

Deno.test("LoadingScreen — 0 total renders 0% without division by zero", () => {
  const html = render(<LoadingScreen loaded={0} total={0} />);
  assertEquals(html.includes("0%"), true);
});

Deno.test("LoadingScreen — fully loaded renders 100%", () => {
  const html = render(<LoadingScreen loaded={45} total={45} />);
  assertEquals(html.includes("100%"), true);
});
