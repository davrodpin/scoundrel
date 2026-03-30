/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { EquippedWeaponCard, LastSlainCard } from "./EquippedWeaponArea.tsx";
import type { Card, EquippedWeapon } from "@scoundrel/engine";

const weaponCard: Card = { suit: "diamonds", rank: 6 };
const monsterCard: Card = { suit: "spades", rank: 10 };

const weapon: EquippedWeapon = {
  card: weaponCard,
  slainMonsters: [],
};

Deno.test("EquippedWeaponCard - renders card image as button when weapon equipped", () => {
  const html = render(<EquippedWeaponCard weapon={weapon} />);
  assertEquals(html.includes("<button"), true);
});

Deno.test("EquippedWeaponCard - renders no weapon placeholder when null", () => {
  const html = render(<EquippedWeaponCard weapon={null} />);
  assertEquals(html.includes("No weapon"), true);
  assertEquals(html.includes("<button"), false);
});

Deno.test("LastSlainCard - renders card image as button when card provided", () => {
  const html = render(<LastSlainCard card={monsterCard} />);
  assertEquals(html.includes("<button"), true);
});

Deno.test("LastSlainCard - renders no kills placeholder when null", () => {
  const html = render(<LastSlainCard card={null} />);
  assertEquals(html.includes("No kills yet"), true);
  assertEquals(html.includes("<button"), false);
});

Deno.test("EquippedWeaponCard - placeholder uses responsive mobile width", () => {
  const html = render(<EquippedWeaponCard weapon={null} />);
  assertEquals(html.includes("w-[clamp(70px,22vw,100px)]"), true);
  assertEquals(html.includes("md:w-[clamp(80px,15vh,170px)]"), true);
});

Deno.test("LastSlainCard - placeholder uses responsive mobile width", () => {
  const html = render(<LastSlainCard card={null} />);
  assertEquals(html.includes("w-[clamp(70px,22vw,100px)]"), true);
  assertEquals(html.includes("md:w-[clamp(80px,15vh,170px)]"), true);
});
