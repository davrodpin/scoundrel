/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { MobileWeaponBar } from "./MobileWeaponBar.tsx";
import type { EquippedWeapon } from "@scoundrel/engine";

Deno.test("MobileWeaponBar - hidden on desktop (md:hidden)", () => {
  const html = render(<MobileWeaponBar weapon={null} />);
  assertEquals(html.includes("md:hidden"), true);
});

Deno.test("MobileWeaponBar - shows No weapon text when weapon is null", () => {
  const html = render(<MobileWeaponBar weapon={null} />);
  assertEquals(html.includes("No weapon"), true);
});

Deno.test("MobileWeaponBar - shows No kills text when weapon has no slain monsters", () => {
  const weapon: EquippedWeapon = {
    card: { suit: "diamonds", rank: 5 },
    slainMonsters: [],
  };
  const html = render(<MobileWeaponBar weapon={weapon} />);
  assertEquals(html.includes("No kills"), true);
});

Deno.test("MobileWeaponBar - shows weapon card image when equipped", () => {
  const weapon: EquippedWeapon = {
    card: { suit: "diamonds", rank: 5 },
    slainMonsters: [],
  };
  const html = render(<MobileWeaponBar weapon={weapon} />);
  assertEquals(html.includes("diamonds_5.jpg"), true);
});

Deno.test("MobileWeaponBar - shows last slain monster when present", () => {
  const weapon: EquippedWeapon = {
    card: { suit: "diamonds", rank: 5 },
    slainMonsters: [{ suit: "clubs", rank: 11 }],
  };
  const html = render(<MobileWeaponBar weapon={weapon} />);
  assertEquals(html.includes("clubs_j.jpg"), true);
});
