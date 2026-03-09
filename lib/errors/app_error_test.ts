import { assertEquals, assertInstanceOf } from "@std/assert";
import { AppError } from "./app_error.ts";

Deno.test("AppError - is an instance of Error", () => {
  const err = new AppError("TestError", 400);
  assertInstanceOf(err, Error);
  assertInstanceOf(err, AppError);
});

Deno.test("AppError - has correct name", () => {
  const err = new AppError("TestError", 400);
  assertEquals(err.name, "AppError");
});

Deno.test("AppError - stores reason", () => {
  const err = new AppError("GameNotFoundError", 404);
  assertEquals(err.reason, "GameNotFoundError");
});

Deno.test("AppError - stores statusCode", () => {
  const err = new AppError("ValidationError", 422);
  assertEquals(err.statusCode, 422);
});

Deno.test("AppError - defaults data to empty object", () => {
  const err = new AppError("TestError", 400);
  assertEquals(err.data, {});
});

Deno.test("AppError - stores provided data", () => {
  const err = new AppError("GameNotFoundError", 404, { gameId: "abc-123" });
  assertEquals(err.data, { gameId: "abc-123" });
});

Deno.test("AppError - message equals reason", () => {
  const err = new AppError("OffensivePlayerNameError", 422);
  assertEquals(err.message, "OffensivePlayerNameError");
});
