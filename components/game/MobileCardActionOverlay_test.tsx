/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { MobileCardActionOverlay } from "./MobileCardActionOverlay.tsx";
import type { Card } from "@scoundrel/engine";
import type { HealthDisplayActions } from "./HealthDisplay.tsx";

const noop = () => {};

const monsterCard: Card = { suit: "clubs", rank: 10 };

function makeActions(
  overrides: Partial<HealthDisplayActions> = {},
): HealthDisplayActions {
  return {
    avoidRoom: { enabled: false, onClick: noop },
    drawCard: { enabled: false, onClick: noop, pending: false },
    fillRoom: { enabled: false, onClick: noop, pending: false },
    fightWithWeapon: { enabled: false, tooltip: "", onClick: noop },
    fightBarehanded: { enabled: false, tooltip: "", onClick: noop },
    equipWeapon: { enabled: false, tooltip: "", onClick: noop },
    drinkPotion: { enabled: false, tooltip: "", onClick: noop },
    ...overrides,
  };
}

Deno.test("MobileCardActionOverlay - renders with md:hidden", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("md:hidden"), true);
});

Deno.test("MobileCardActionOverlay - renders selected card image", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("clubs_10.jpg"), true);
});

Deno.test("MobileCardActionOverlay - renders enabled action button labels", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions({
        fightBarehanded: { enabled: true, tooltip: "", onClick: noop },
        fightWithWeapon: { enabled: true, tooltip: "", onClick: noop },
      })}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("Fight Barehanded"), true);
  assertEquals(html.includes("Fight w/ Weapon"), true);
});

Deno.test("MobileCardActionOverlay - has Cancel button", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("Cancel"), true);
});

Deno.test("MobileCardActionOverlay - button without tooltip uses text-center", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions({
        equipWeapon: { enabled: true, tooltip: "", onClick: noop },
      })}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("text-center"), true);
});

Deno.test("MobileCardActionOverlay - button with tooltip uses text-center", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions({
        fightBarehanded: {
          enabled: true,
          tooltip: "Barehanded: 6 dmg",
          onClick: noop,
        },
      })}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("text-center"), true);
  assertEquals(html.includes("text-left"), false);
});

Deno.test("MobileCardActionOverlay - has backdrop class bg-shadow/80", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("bg-shadow/80"), true);
});

Deno.test("MobileCardActionOverlay - action buttons use text-xs", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions({
        fightBarehanded: { enabled: true, tooltip: "", onClick: noop },
      })}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("text-xs"), true);
});

Deno.test("MobileCardActionOverlay - renders card at larger preview size", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
    />,
  );
  assertEquals(html.includes("w-[clamp(160px,45vw,260px)]"), true);
});

Deno.test("MobileCardActionOverlay - hides cancel button when pendingLabel is set", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
      pendingLabel="Striking with steel..."
    />,
  );
  assertEquals(html.includes("Cancel"), false);
});

Deno.test("MobileCardActionOverlay - shows pending label when pendingLabel is set", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
      pendingLabel="Fighting barehanded..."
    />,
  );
  assertEquals(html.includes("Fighting barehanded..."), true);
});

Deno.test("MobileCardActionOverlay - shows cancel button when pendingLabel is null", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
      pendingLabel={null}
    />,
  );
  assertEquals(html.includes("Cancel"), true);
});

Deno.test("MobileCardActionOverlay - shows animate-pulse on pending label", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
      pendingLabel="Striking with steel..."
    />,
  );
  assertEquals(html.includes("animate-pulse"), true);
});

Deno.test("MobileCardActionOverlay - disables background click when pending", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
      pendingLabel="Striking with steel..."
    />,
  );
  // The outer div should have pointer-events-none to prevent dismissal
  assertEquals(html.includes("pointer-events-none"), true);
});

Deno.test("MobileCardActionOverlay - overlay is vertically centered", () => {
  const html = render(
    <MobileCardActionOverlay
      card={monsterCard}
      actions={makeActions()}
      onCancel={noop}
    />,
  );
  // Scroll container: outer div handles overflow, inner wrapper handles centering
  assertEquals(html.includes("overflow-y-auto"), true);
  assertEquals(html.includes("min-h-full"), true);
  assertEquals(html.includes("items-center"), true);
  assertEquals(html.includes("justify-center"), true);
});
