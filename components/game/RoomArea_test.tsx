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

Deno.test("RoomArea - uses flex row layout on all breakpoints", () => {
  const html = render(
    <RoomArea
      cards={cards}
      interactive={false}
    />,
  );
  assertEquals(html.includes("flex justify-center"), true);
  assertEquals(html.includes("grid-cols-2"), false);
});

Deno.test("RoomArea - non-first slots have overlap class on mobile", () => {
  const html = render(
    <RoomArea
      cards={cards}
      interactive={false}
    />,
  );
  assertEquals(html.includes("-ml-10"), true);
});

Deno.test("RoomArea - selected card wrapper gets z-50", () => {
  const html = render(
    <RoomArea
      cards={cards}
      interactive
      selectedIndex={1}
    />,
  );
  assertEquals(html.includes("z-index:50"), true);
});

Deno.test("RoomArea - empty slots use responsive width", () => {
  const html = render(
    <RoomArea
      cards={[]}
      interactive={false}
    />,
  );
  assertEquals(html.includes("w-[clamp(70px,22vw,100px)]"), true);
  assertEquals(html.includes("md:w-[clamp(140px,28vw,230px)]"), true);
});
