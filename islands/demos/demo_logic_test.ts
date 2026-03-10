import { assertEquals } from "@std/assert";
import {
  applyPotion,
  canWeaponFight,
  computeCombatDamage,
} from "./demo_logic.ts";

// --- computeCombatDamage ---

Deno.test("computeCombatDamage - barehanded takes full monster damage", () => {
  const result = computeCombatDamage(10, null);
  assertEquals(result.damage, 10);
  assertEquals(result.method, "barehanded");
});

Deno.test("computeCombatDamage - weapon reduces damage", () => {
  const result = computeCombatDamage(11, 7);
  assertEquals(result.damage, 4);
  assertEquals(result.method, "weapon");
});

Deno.test("computeCombatDamage - weapon stronger than monster deals no damage", () => {
  const result = computeCombatDamage(3, 5);
  assertEquals(result.damage, 0);
  assertEquals(result.method, "weapon");
});

Deno.test("computeCombatDamage - weapon equal to monster deals no damage", () => {
  const result = computeCombatDamage(5, 5);
  assertEquals(result.damage, 0);
  assertEquals(result.method, "weapon");
});

// --- canWeaponFight ---

Deno.test("canWeaponFight - fresh weapon (null) can fight any monster", () => {
  assertEquals(canWeaponFight(null, 13), true);
  assertEquals(canWeaponFight(null, 2), true);
});

Deno.test("canWeaponFight - can fight monster of lower rank than last slain", () => {
  assertEquals(canWeaponFight(6, 5), true);
});

Deno.test("canWeaponFight - can fight monster of equal rank to last slain", () => {
  assertEquals(canWeaponFight(6, 6), true);
});

Deno.test("canWeaponFight - cannot fight monster of higher rank than last slain", () => {
  assertEquals(canWeaponFight(6, 7), false);
  assertEquals(canWeaponFight(6, 13), false);
});

// --- applyPotion ---

Deno.test("applyPotion - heals by potion value", () => {
  const result = applyPotion(14, 5, false);
  assertEquals(result.newHealth, 19);
  assertEquals(result.applied, true);
});

Deno.test("applyPotion - caps health at 20", () => {
  const result = applyPotion(18, 7, false);
  assertEquals(result.newHealth, 20);
  assertEquals(result.applied, true);
});

Deno.test("applyPotion - does not exceed max when at 20", () => {
  const result = applyPotion(20, 5, false);
  assertEquals(result.newHealth, 20);
  assertEquals(result.applied, true);
});

Deno.test("applyPotion - rejected when potion already used this turn", () => {
  const result = applyPotion(14, 5, true);
  assertEquals(result.newHealth, 14);
  assertEquals(result.applied, false);
  assertEquals(result.reason, "only one potion per turn");
});
