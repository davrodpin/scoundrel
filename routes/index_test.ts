import { assertEquals } from "@std/assert";
import { createIndexRedirect } from "./index.tsx";

Deno.test("createIndexRedirect - returns 302 redirect to /play", () => {
  const response = createIndexRedirect();
  assertEquals(response.status, 302);
  assertEquals(response.headers.get("Location"), "/play");
});
