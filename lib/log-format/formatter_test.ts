import { assertEquals } from "@std/assert";
import { selectFormatter } from "./formatter.ts";
import type { LogRecord } from "@logtape/logtape";

const SAMPLE_RECORD: LogRecord = {
  level: "info",
  category: ["scoundrel", "game"],
  message: ["Game created"],
  rawMessage: "Game created",
  properties: { gameId: "abc123" },
  timestamp: Date.now(),
};

Deno.test("selectFormatter returns a function for 'production'", () => {
  const formatter = selectFormatter("production");
  assertEquals(typeof formatter, "function");
});

Deno.test("selectFormatter returns a function for 'test'", () => {
  const formatter = selectFormatter("test");
  assertEquals(typeof formatter, "function");
});

Deno.test("selectFormatter returns a function for 'local'", () => {
  const formatter = selectFormatter("local");
  assertEquals(typeof formatter, "function");
});

Deno.test("JSON formatter used for 'production' produces valid JSON with structured properties", () => {
  const formatter = selectFormatter("production");
  const output = formatter(SAMPLE_RECORD) as string;
  const parsed = JSON.parse(output);
  assertEquals(parsed.gameId, "abc123");
});

Deno.test("JSON formatter used for 'test' produces valid JSON with structured properties", () => {
  const formatter = selectFormatter("test");
  const output = formatter(SAMPLE_RECORD) as string;
  const parsed = JSON.parse(output);
  assertEquals(parsed.gameId, "abc123");
});

Deno.test("ANSI formatter used for 'local' produces non-JSON output", () => {
  const formatter = selectFormatter("local");
  const output = formatter(SAMPLE_RECORD) as string;
  // ANSI output is not valid JSON (it contains formatted text with category/level)
  let parseFailed = false;
  try {
    JSON.parse(output);
  } catch {
    parseFailed = true;
  }
  assertEquals(parseFailed, true, "Expected ANSI output to not be valid JSON");
});
