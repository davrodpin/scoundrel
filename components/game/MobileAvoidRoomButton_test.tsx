/** @jsxImportSource preact */
/// <reference lib="dom" />
import { assertEquals } from "@std/assert";
import { render } from "npm:preact-render-to-string@6.6.5";
import { MobileAvoidRoomButton } from "./MobileAvoidRoomButton.tsx";

Deno.test("MobileAvoidRoomButton - renders button when enabled", () => {
  const html = render(
    <MobileAvoidRoomButton enabled onClick={() => {}} pending={false} />,
  );
  assertEquals(html.includes("Avoid Room"), true);
  assertEquals(html.includes("<button"), true);
});

Deno.test("MobileAvoidRoomButton - renders nothing when disabled", () => {
  const html = render(
    <MobileAvoidRoomButton
      enabled={false}
      onClick={() => {}}
      pending={false}
    />,
  );
  assertEquals(html, "");
});

Deno.test("MobileAvoidRoomButton - shows loading indicator when pending", () => {
  const html = render(
    <MobileAvoidRoomButton enabled onClick={() => {}} pending />,
  );
  assertEquals(html.includes("…"), true);
});

Deno.test("MobileAvoidRoomButton - applies torch-amber styling", () => {
  const html = render(
    <MobileAvoidRoomButton enabled onClick={() => {}} pending={false} />,
  );
  assertEquals(html.includes("bg-torch-amber"), true);
});

Deno.test("MobileAvoidRoomButton - renders within centered wrapper", () => {
  const html = render(
    <MobileAvoidRoomButton enabled onClick={() => {}} pending={false} />,
  );
  assertEquals(html.includes("flex justify-center"), true);
});

Deno.test("MobileAvoidRoomButton - button is not full width", () => {
  const html = render(
    <MobileAvoidRoomButton enabled onClick={() => {}} pending={false} />,
  );
  assertEquals(html.includes("w-full"), false);
});
