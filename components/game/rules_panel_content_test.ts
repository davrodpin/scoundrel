import { assertEquals } from "@std/assert";
import { RULES_SECTIONS } from "./rules_panel_content.ts";

Deno.test("rules sections has exactly 5 sections", () => {
  assertEquals(RULES_SECTIONS.length, 5);
});

Deno.test("rules sections have expected titles in order", () => {
  const titles = RULES_SECTIONS.map((s) => s.title);
  assertEquals(titles, [
    "Goal",
    "Card Types",
    "Turn Flow",
    "Combat",
    "Scoring",
  ]);
});

Deno.test("each rules section has non-empty title and body", () => {
  for (const section of RULES_SECTIONS) {
    assertEquals(typeof section.title, "string");
    assertEquals(typeof section.body, "string");
    assertEquals(section.title.length > 0, true);
    assertEquals(section.body.length > 0, true);
  }
});

Deno.test("combat section mentions weapon restriction rule", () => {
  const combat = RULES_SECTIONS.find((s) => s.title === "Combat");
  assertEquals(combat !== undefined, true);
  assertEquals(combat!.body.includes("lower"), true);
});

Deno.test("scoring section mentions both outcomes", () => {
  const scoring = RULES_SECTIONS.find((s) => s.title === "Scoring");
  assertEquals(scoring !== undefined, true);
  assertEquals(scoring!.body.includes("health reaches 0"), true);
  assertEquals(scoring!.body.includes("cleared"), true);
});
