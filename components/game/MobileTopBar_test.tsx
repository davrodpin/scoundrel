/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { MobileTopBar } from "./MobileTopBar.tsx";

const noop = () => {};

const baseProps = {
  health: 14,
  maxHealth: 20,
  playerName: "Aldric",
  damageFlash: false,
  healFlash: false,
  onRulesClick: noop,
  onLeaderboardClick: noop,
  onCopyLinkClick: noop,
  copiedLink: false,
};

Deno.test("MobileTopBar - hidden on desktop (md:hidden)", () => {
  const html = render(<MobileTopBar {...baseProps} />);
  assertEquals(html.includes("md:hidden"), true);
});

Deno.test("MobileTopBar - contains player name and health values", () => {
  const html = render(<MobileTopBar {...baseProps} />);
  assertEquals(html.includes("Aldric"), true);
  assertEquals(html.includes("14"), true);
  assertEquals(html.includes("20"), true);
});

Deno.test("MobileTopBar - contains Game rules button", () => {
  const html = render(<MobileTopBar {...baseProps} />);
  assertEquals(html.includes(`aria-label="Game rules"`), true);
});

Deno.test("MobileTopBar - contains Leaderboard button", () => {
  const html = render(<MobileTopBar {...baseProps} />);
  assertEquals(
    html.includes(`aria-label="The Gravekeeper&#39;s Ledger"`),
    true,
  );
});

Deno.test("MobileTopBar - contains copy link button with correct aria-label when not copied", () => {
  const html = render(<MobileTopBar {...baseProps} copiedLink={false} />);
  assertEquals(html.includes(`aria-label="Copy shareable link"`), true);
});

Deno.test("MobileTopBar - copy link button shows copied state", () => {
  const html = render(<MobileTopBar {...baseProps} copiedLink />);
  assertEquals(html.includes(`aria-label="Link copied!"`), true);
});

Deno.test("MobileTopBar - renders back to menu button", () => {
  const html = render(
    <MobileTopBar {...baseProps} onBackToMenuClick={noop} />,
  );
  assertEquals(html.includes(`aria-label="Flee the Dungeon"`), true);
});
