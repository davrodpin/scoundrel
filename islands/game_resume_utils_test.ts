import { assertEquals } from "@std/assert";
import {
  ERROR_MESSAGES,
  getErrorMessage,
  resolveLoadGameError,
} from "./game_resume_utils.ts";

Deno.test("ERROR_MESSAGES - contains all expected error reasons", () => {
  assertEquals(typeof ERROR_MESSAGES["GameNotFoundError"], "string");
  assertEquals(typeof ERROR_MESSAGES["InternalError"], "string");
  assertEquals(typeof ERROR_MESSAGES["ValidationError"], "string");
  assertEquals(typeof ERROR_MESSAGES["InvalidActionError"], "string");
  assertEquals(typeof ERROR_MESSAGES["OffensivePlayerNameError"], "string");
  assertEquals(typeof ERROR_MESSAGES["InvalidJsonError"], "string");
});

Deno.test("getErrorMessage - extracts message from known error reason", () => {
  const data = { error: { reason: "GameNotFoundError" } };
  assertEquals(getErrorMessage(data), ERROR_MESSAGES["GameNotFoundError"]);
});

Deno.test("getErrorMessage - returns fallback for unknown reason", () => {
  const data = { error: { reason: "UnknownError" } };
  assertEquals(getErrorMessage(data), "Something went wrong");
});

Deno.test("getErrorMessage - returns fallback for null input", () => {
  assertEquals(getErrorMessage(null), "Something went wrong");
});

Deno.test("getErrorMessage - returns fallback for non-object input", () => {
  assertEquals(getErrorMessage("oops"), "Something went wrong");
});

Deno.test("getErrorMessage - returns fallback when error has no reason", () => {
  const data = { error: {} };
  assertEquals(getErrorMessage(data), "Something went wrong");
});

Deno.test("resolveLoadGameError - returns null when response is ok", () => {
  assertEquals(resolveLoadGameError(true, 200, null), null);
});

Deno.test("resolveLoadGameError - returns GameNotFoundError message for 404", () => {
  const result = resolveLoadGameError(false, 404, null);
  assertEquals(result, ERROR_MESSAGES["GameNotFoundError"]);
});

Deno.test("resolveLoadGameError - extracts message from error body for non-404 errors", () => {
  const data = { error: { reason: "InternalError" } };
  const result = resolveLoadGameError(false, 500, data);
  assertEquals(result, ERROR_MESSAGES["InternalError"]);
});

Deno.test("resolveLoadGameError - returns generic fallback when error body is null", () => {
  const result = resolveLoadGameError(false, 500, null);
  assertEquals(result, "Failed to load game");
});
