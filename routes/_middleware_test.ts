import { assertEquals } from "@std/assert";
import { captureRequestBody } from "./_middleware_helpers.ts";

Deno.test("captureRequestBody - returns null for GET requests", async () => {
  const req = new Request("http://localhost/api/games/123");
  const body = await captureRequestBody(req, "GET", "/api/games/123");
  assertEquals(body, null);
});

Deno.test("captureRequestBody - returns null for HEAD requests", async () => {
  const req = new Request("http://localhost/api/games/123", { method: "HEAD" });
  const body = await captureRequestBody(req, "HEAD", "/api/games/123");
  assertEquals(body, null);
});

Deno.test("captureRequestBody - returns null for non-API paths", async () => {
  const req = new Request("http://localhost/some-page", {
    method: "POST",
    body: JSON.stringify({ type: "enter_room" }),
    headers: { "Content-Type": "application/json" },
  });
  const body = await captureRequestBody(req, "POST", "/some-page");
  assertEquals(body, null);
});

Deno.test(
  "captureRequestBody - returns parsed JSON for POST to API path",
  async () => {
    const payload = { type: "enter_room" };
    const req = new Request("http://localhost/api/games/123/actions", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const body = await captureRequestBody(
      req,
      "POST",
      "/api/games/123/actions",
    );
    assertEquals(body, payload);
  },
);

Deno.test(
  "captureRequestBody - returns null when body is invalid JSON",
  async () => {
    const req = new Request("http://localhost/api/games/123/actions", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const body = await captureRequestBody(
      req,
      "POST",
      "/api/games/123/actions",
    );
    assertEquals(body, null);
  },
);

Deno.test(
  "captureRequestBody - returns null when POST has no body",
  async () => {
    const req = new Request("http://localhost/api/games", { method: "POST" });
    const body = await captureRequestBody(req, "POST", "/api/games");
    assertEquals(body, null);
  },
);

Deno.test(
  "captureRequestBody - original request body remains readable after capture",
  async () => {
    const payload = { type: "enter_room" };
    const req = new Request("http://localhost/api/games/123/actions", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    await captureRequestBody(req, "POST", "/api/games/123/actions");
    // Original request body should still be readable by route handlers
    const originalBody = await req.json();
    assertEquals(originalBody, payload);
  },
);
