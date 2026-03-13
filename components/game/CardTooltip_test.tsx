/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { CardTooltip } from "./CardTooltip.tsx";

Deno.test("CardTooltip - renders children when no lines", () => {
  const html = render(
    <CardTooltip lines={[]}>
      <span>child</span>
    </CardTooltip>,
  );
  assertEquals(html.includes("child"), true);
  assertEquals(html.includes("bg-ink"), false);
});

Deno.test("CardTooltip - renders tooltip lines when provided", () => {
  const html = render(
    <CardTooltip lines={["Line one", "Line two"]}>
      <span>child</span>
    </CardTooltip>,
  );
  assertEquals(html.includes("Line one"), true);
  assertEquals(html.includes("Line two"), true);
});

Deno.test("CardTooltip - tooltip uses bg-ink background", () => {
  const html = render(
    <CardTooltip lines={["some info"]}>
      <span>child</span>
    </CardTooltip>,
  );
  assertEquals(html.includes("bg-ink"), true);
});

Deno.test("CardTooltip - tooltip text uses text-white for contrast", () => {
  const html = render(
    <CardTooltip lines={["some info"]}>
      <span>child</span>
    </CardTooltip>,
  );
  assertEquals(html.includes("text-white"), true);
});
