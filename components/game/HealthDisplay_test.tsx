/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { HealthDisplay } from "./HealthDisplay.tsx";

Deno.test("HealthDisplay - renders player name", () => {
  const html = render(
    <HealthDisplay health={15} maxHealth={20} playerName="Aragorn" />,
  );
  assertEquals(html.includes("Aragorn"), true);
});

Deno.test("HealthDisplay - renders health values", () => {
  const html = render(
    <HealthDisplay health={15} maxHealth={20} playerName="Aragorn" />,
  );
  assertEquals(html.includes("15"), true);
  assertEquals(html.includes("20"), true);
});
