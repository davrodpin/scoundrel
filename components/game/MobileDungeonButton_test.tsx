/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { MobileDungeonButton } from "./MobileDungeonButton.tsx";

const noop = () => {};

Deno.test("MobileDungeonButton - hidden on desktop (md:hidden)", () => {
  const html = render(
    <MobileDungeonButton
      isEmpty={false}
      interactive
      onClick={noop}
      pending={false}
    />,
  );
  assertEquals(html.includes("md:hidden"), true);
});

Deno.test("MobileDungeonButton - shows Draw from Dungeon text", () => {
  const html = render(
    <MobileDungeonButton
      isEmpty={false}
      interactive
      onClick={noop}
      pending={false}
    />,
  );
  assertEquals(html.includes("Draw from Dungeon"), true);
});

Deno.test("MobileDungeonButton - shows Dungeon Empty text when isEmpty", () => {
  const html = render(
    <MobileDungeonButton
      isEmpty
      interactive={false}
      onClick={noop}
      pending={false}
    />,
  );
  assertEquals(html.includes("Dungeon Empty"), true);
});

Deno.test("MobileDungeonButton - applies pending animation when pending", () => {
  const html = render(
    <MobileDungeonButton
      isEmpty={false}
      interactive
      onClick={noop}
      pending
    />,
  );
  assertEquals(html.includes("animate-dungeon-draw"), true);
});

Deno.test("MobileDungeonButton - disabled when not interactive", () => {
  const html = render(
    <MobileDungeonButton
      isEmpty={false}
      interactive={false}
      onClick={noop}
      pending={false}
    />,
  );
  assertEquals(html.includes("disabled"), true);
});
