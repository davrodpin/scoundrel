/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { CardImage } from "./CardImage.tsx";

import type { Card } from "@scoundrel/engine";
const card: Card = { suit: "clubs", rank: 6 };

Deno.test("CardImage - selected applies amber border and ring classes", () => {
  const html = render(<CardImage card={card} selected />);
  assertEquals(html.includes("border-torch-amber"), true);
  assertEquals(html.includes("ring-2"), true);
  assertEquals(html.includes("ring-torch-glow"), true);
  assertEquals(html.includes("-translate-y-2"), true);
});

Deno.test("CardImage - selected takes priority over highlighted", () => {
  const html = render(<CardImage card={card} selected highlighted />);
  // selected class should be present
  assertEquals(html.includes("border-torch-amber"), true);
  assertEquals(html.includes("ring-2"), true);
  // highlighted glow (weaker one) should not override
  assertEquals(html.includes("shadow-[0_0_8px_rgba(230,168,50,0.4)]"), false);
  assertEquals(html.includes("shadow-[0_0_16px_rgba(230,168,50,0.7)]"), true);
});

Deno.test("CardImage - highlighted applies glow border when not selected", () => {
  const html = render(<CardImage card={card} highlighted />);
  assertEquals(html.includes("border-torch-glow"), true);
  assertEquals(html.includes("shadow-[0_0_8px_rgba(230,168,50,0.4)]"), true);
  assertEquals(html.includes("ring-2"), false);
});

Deno.test("CardImage - default uses dungeon border when not selected or highlighted", () => {
  const html = render(<CardImage card={card} />);
  assertEquals(html.includes("border-dungeon-border"), true);
  assertEquals(html.includes("ring-2"), false);
});

Deno.test("CardImage - uses responsive mobile width class", () => {
  const html = render(<CardImage card={card} />);
  assertEquals(html.includes("w-[clamp(70px,22vw,100px)]"), true);
  assertEquals(html.includes("md:w-[clamp(140px,28vw,230px)]"), true);
});
