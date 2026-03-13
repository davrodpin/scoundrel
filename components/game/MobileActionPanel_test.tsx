/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { MobileActionPanel } from "./MobileActionPanel.tsx";
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

Deno.test("MobileActionPanel - hidden on desktop (md:hidden)", () => {
  const html = render(<MobileActionPanel actions={makeActions()} />);
  assertEquals(html.includes("md:hidden"), true);
});

Deno.test("MobileActionPanel - renders all action button labels", () => {
  const html = render(<MobileActionPanel actions={makeActions()} />);
  assertEquals(html.includes("Avoid Room"), true);
  assertEquals(html.includes("Fight w/ Weapon"), true);
  assertEquals(html.includes("Fight Barehanded"), true);
  assertEquals(html.includes("Equip Weapon"), true);
  assertEquals(html.includes("Drink Potion"), true);
});

Deno.test("MobileActionPanel - shows inline tooltip for fightWithWeapon when enabled", () => {
  const html = render(
    <MobileActionPanel
      actions={makeActions({
        fightWithWeapon: {
          enabled: true,
          tooltip: "Weapon: 4 dmg",
          onClick: noop,
        },
      })}
    />,
  );
  assertEquals(html.includes("Weapon: 4 dmg"), true);
});

Deno.test("MobileActionPanel - shows inline tooltip for drinkPotion when enabled", () => {
  const html = render(
    <MobileActionPanel
      actions={makeActions({
        drinkPotion: {
          enabled: true,
          tooltip: "Heals 6 HP",
          onClick: noop,
        },
      })}
    />,
  );
  assertEquals(html.includes("Heals 6 HP"), true);
});

Deno.test("MobileActionPanel - disabled buttons have opacity class", () => {
  const html = render(
    <MobileActionPanel
      actions={makeActions({
        fightWithWeapon: { enabled: false, tooltip: "", onClick: noop },
      })}
    />,
  );
  assertEquals(html.includes("opacity-40"), true);
});
