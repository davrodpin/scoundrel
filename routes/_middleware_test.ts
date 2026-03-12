import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { AppError } from "@scoundrel/errors";
import {
  captureRequestBody,
  checkBodySize,
  extractClientIp,
  extractErrorInfo,
  extractErrorStatus,
  toErrorResponse,
} from "./_middleware_helpers.ts";

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

Deno.test("toErrorResponse - returns null for Fresh 4xx errors", () => {
  const freshError = Object.assign(new Error("Not Found"), { status: 404 });
  const result = toErrorResponse(freshError);
  assertStrictEquals(result, null);
});

Deno.test("toErrorResponse - AppError returns correct status and shape", async () => {
  const err = new AppError("GameNotFoundError", 404, { gameId: "abc" });
  const response = toErrorResponse(err);
  assertEquals(response?.status, 404);
  const body = await response?.json();
  assertEquals(body, {
    code: 404,
    error: { reason: "GameNotFoundError", data: { gameId: "abc" } },
  });
});

Deno.test("toErrorResponse - AppError with empty data", async () => {
  const err = new AppError("ValidationError", 422);
  const response = toErrorResponse(err);
  assertEquals(response?.status, 422);
  const body = await response?.json();
  assertEquals(body, {
    code: 422,
    error: { reason: "ValidationError", data: {} },
  });
});

Deno.test("toErrorResponse - unknown error returns 500 InternalError", async () => {
  const response = toErrorResponse(new Error("oops"));
  assertEquals(response?.status, 500);
  const body = await response?.json();
  assertEquals(body, {
    code: 500,
    error: { reason: "InternalError", data: {} },
  });
});

Deno.test("toErrorResponse - unknown error (non-Error object) returns 500", async () => {
  const response = toErrorResponse("something went wrong");
  assertEquals(response?.status, 500);
  const body = await response?.json();
  assertEquals(body.code, 500);
  assertEquals(body.error.reason, "InternalError");
});

// extractClientIp tests
Deno.test("extractClientIp - returns first IP from X-Forwarded-For header", () => {
  const req = new Request("http://localhost/api/games", {
    headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
  });
  assertEquals(extractClientIp(req), "1.2.3.4");
});

Deno.test("extractClientIp - returns single IP from X-Forwarded-For header", () => {
  const req = new Request("http://localhost/api/games", {
    headers: { "x-forwarded-for": "9.9.9.9" },
  });
  assertEquals(extractClientIp(req), "9.9.9.9");
});

Deno.test("extractClientIp - returns 'unknown' when no IP headers present", () => {
  const req = new Request("http://localhost/api/games");
  assertEquals(extractClientIp(req), "unknown");
});

Deno.test("extractClientIp - returns remoteAddr when no X-Forwarded-For header", () => {
  const req = new Request("http://localhost/api/games");
  assertEquals(extractClientIp(req, "10.0.0.1"), "10.0.0.1");
});

Deno.test("extractClientIp - resolves 'localhost' hostname to 127.0.0.1", () => {
  const req = new Request("http://localhost/api/games");
  assertEquals(extractClientIp(req, "localhost"), "127.0.0.1");
});

Deno.test("extractClientIp - X-Forwarded-For takes priority over remoteAddr", () => {
  const req = new Request("http://localhost/api/games", {
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
  assertEquals(extractClientIp(req, "10.0.0.1"), "1.2.3.4");
});

// checkBodySize tests
Deno.test("checkBodySize - passes when content-length is within limit", () => {
  const req = new Request("http://localhost/api/games", {
    method: "POST",
    headers: { "content-length": "100" },
  });
  checkBodySize(req, 1024);
});

Deno.test("checkBodySize - passes when content-length header is absent", () => {
  const req = new Request("http://localhost/api/games", { method: "POST" });
  checkBodySize(req, 1024);
});

Deno.test("checkBodySize - throws PayloadTooLargeError when content-length exceeds limit", () => {
  const req = new Request("http://localhost/api/games", {
    method: "POST",
    headers: { "content-length": "5000" },
  });
  assertThrows(
    () => checkBodySize(req, 1024),
    AppError,
    "PayloadTooLargeError",
  );
});

Deno.test("checkBodySize - throws with status 413", () => {
  const req = new Request("http://localhost/api/games", {
    method: "POST",
    headers: { "content-length": "2048" },
  });
  let thrown: AppError | undefined;
  try {
    checkBodySize(req, 1024);
  } catch (e) {
    thrown = e as AppError;
  }
  assertEquals(thrown?.statusCode, 413);
});

// extractErrorInfo tests
Deno.test("extractErrorInfo - AppError returns reason as error and stack as errorStack", () => {
  const err = new AppError("ValidationError", 422);
  const result = extractErrorInfo(err);
  assertEquals(result.error, "ValidationError");
  assertEquals(typeof result.errorStack, "string");
  assertEquals(result.errorStack.length > 0, true);
});

Deno.test("extractErrorInfo - standard Error returns name as error and stack as errorStack", () => {
  const err = new TypeError("bad value");
  const result = extractErrorInfo(err);
  assertEquals(result.error, "TypeError");
  assertEquals(typeof result.errorStack, "string");
  assertEquals(result.errorStack.length > 0, true);
});

Deno.test("extractErrorInfo - non-error value returns stringified value and empty errorStack", () => {
  const result = extractErrorInfo("something went wrong");
  assertEquals(result.error, "something went wrong");
  assertEquals(result.errorStack, "");
});

Deno.test("extractErrorInfo - null returns stringified null and empty errorStack", () => {
  const result = extractErrorInfo(null);
  assertEquals(result.error, "null");
  assertEquals(result.errorStack, "");
});

// extractErrorStatus tests
Deno.test("extractErrorStatus - returns status from error object with numeric status property", () => {
  const err = Object.assign(new Error("Not Found"), { status: 404 });
  assertEquals(extractErrorStatus(err), 404);
});

Deno.test("extractErrorStatus - returns AppError statusCode", () => {
  const err = new AppError("ValidationError", 422);
  assertEquals(extractErrorStatus(err), 422);
});

Deno.test("extractErrorStatus - returns 0 for standard Error without status", () => {
  assertEquals(extractErrorStatus(new Error("oops")), 0);
});

Deno.test("extractErrorStatus - returns 0 for non-error values", () => {
  assertEquals(extractErrorStatus("string error"), 0);
  assertEquals(extractErrorStatus(null), 0);
  assertEquals(extractErrorStatus(42), 0);
});
