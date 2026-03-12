/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { HealthDisplay } from "./HealthDisplay.tsx";
import type { HealthDisplayActions } from "./HealthDisplay.tsx";

const noop = () => {};

function makeActions(
  overrides: Partial<HealthDisplayActions> = {},
): HealthDisplayActions {
  return {
    avoidRoom: { enabled: false, onClick: noop },
    fightWithWeapon: { enabled: false, tooltip: "", onClick: noop },
    fightBarehanded: { enabled: false, tooltip: "", onClick: noop },
    equipWeapon: { enabled: false, tooltip: "", onClick: noop },
    drinkPotion: { enabled: false, tooltip: "", onClick: noop },
    ...overrides,
  };
}

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

Deno.test("HealthDisplay - renders all 5 action buttons when actions provided", () => {
  const html = render(
    <HealthDisplay
      health={15}
      maxHealth={20}
      playerName="Aragorn"
      actions={makeActions()}
    />,
  );
  assertEquals(html.includes("Avoid Room"), true);
  assertEquals(html.includes("Fight w/ Weapon"), true);
  assertEquals(html.includes("Fight Barehanded"), true);
  assertEquals(html.includes("Equip Weapon"), true);
  assertEquals(html.includes("Drink Potion"), true);
});

Deno.test("HealthDisplay - no actions panel when actions not provided", () => {
  const html = render(
    <HealthDisplay health={15} maxHealth={20} playerName="Aragorn" />,
  );
  assertEquals(html.includes("Avoid Room"), false);
});

Deno.test("HealthDisplay - Fight Barehanded shows tooltip text", () => {
  const html = render(
    <HealthDisplay
      health={15}
      maxHealth={20}
      playerName="Aragorn"
      actions={makeActions({
        fightBarehanded: {
          enabled: true,
          tooltip: "Barehanded: 6 dmg",
          onClick: noop,
        },
      })}
    />,
  );
  assertEquals(html.includes("Barehanded: 6 dmg"), true);
});

Deno.test("HealthDisplay - Fight w/ Weapon shows tooltip text", () => {
  const html = render(
    <HealthDisplay
      health={15}
      maxHealth={20}
      playerName="Aragorn"
      actions={makeActions({
        fightWithWeapon: {
          enabled: true,
          tooltip: "Weapon: 3 dmg",
          onClick: noop,
        },
      })}
    />,
  );
  assertEquals(html.includes("Weapon: 3 dmg"), true);
});

Deno.test("HealthDisplay - Equip Weapon shows tooltip text", () => {
  const html = render(
    <HealthDisplay
      health={15}
      maxHealth={20}
      playerName="Aragorn"
      actions={makeActions({
        equipWeapon: {
          enabled: true,
          tooltip: "Equip (rank 5)",
          onClick: noop,
        },
      })}
    />,
  );
  assertEquals(html.includes("Equip (rank 5)"), true);
});

Deno.test("HealthDisplay - Drink Potion shows tooltip text", () => {
  const html = render(
    <HealthDisplay
      health={15}
      maxHealth={20}
      playerName="Aragorn"
      actions={makeActions({
        drinkPotion: { enabled: true, tooltip: "Heals 4 HP", onClick: noop },
      })}
    />,
  );
  assertEquals(html.includes("Heals 4 HP"), true);
});

Deno.test("HealthDisplay - tooltip uses high-contrast background (bg-ink)", () => {
  const html = render(
    <HealthDisplay
      health={15}
      maxHealth={20}
      playerName="Aragorn"
      actions={makeActions({
        fightBarehanded: {
          enabled: true,
          tooltip: "Barehanded: 6 dmg",
          onClick: noop,
        },
      })}
    />,
  );
  assertEquals(html.includes("bg-ink"), true);
});
