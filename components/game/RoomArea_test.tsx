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

Deno.test("RoomArea - uses responsive 2x2 grid on mobile", () => {
  const html = render(
    <RoomArea
      cards={cards}
      interactive={false}
    />,
  );
  assertEquals(html.includes("grid-cols-2"), true);
  assertEquals(html.includes("md:flex"), true);
});

Deno.test("RoomArea - empty slots use responsive width", () => {
  const html = render(
    <RoomArea
      cards={[]}
      interactive={false}
    />,
  );
  assertEquals(html.includes("w-[clamp(90px,30vw,120px)]"), true);
  assertEquals(html.includes("md:w-[clamp(140px,28vw,230px)]"), true);
});
