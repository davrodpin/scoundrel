/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { RoomArea } from "./RoomArea.tsx";
import type { Card } from "@scoundrel/engine";

const cards: Card[] = [
  { suit: "clubs", rank: 5 },
  { suit: "spades", rank: 10 },
  { suit: "diamonds", rank: 7 },
  { suit: "hearts", rank: 3 },
];

Deno.test("RoomArea - uses flex row layout with gap on all breakpoints", () => {
  const html = render(
    <RoomArea
      cards={cards}
      interactive={false}
    />,
  );
  assertEquals(html.includes("flex gap-1 justify-center"), true);
  assertEquals(html.includes("grid-cols-2"), false);
});

Deno.test("RoomArea - no overlap class on mobile", () => {
  const html = render(
    <RoomArea
      cards={cards}
      interactive={false}
    />,
  );
  assertEquals(html.includes("-ml-10"), false);
});

Deno.test("RoomArea - empty slots use responsive width", () => {
  const html = render(
    <RoomArea
      cards={[]}
      interactive={false}
    />,
  );
  assertEquals(html.includes("w-[clamp(70px,20vw,100px)]"), true);
  assertEquals(html.includes("md:w-[clamp(140px,28vw,230px)]"), true);
});
