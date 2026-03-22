import {
  assertEquals,
  assertObjectMatch,
  assertStringIncludes,
} from "@std/assert";
import { selectFormatter } from "@scoundrel/log-format";

function makeRecord(
  properties: Record<string, unknown> = {},
): Parameters<ReturnType<typeof selectFormatter>>[0] {
  return {
    category: ["scoundrel", "http"],
    level: "info" as const,
    timestamp: 1704067200000,
    message: ["Request"],
    rawMessage: "Request",
    properties,
  };
}

Deno.test("selectFormatter returns a formatter function in development", () => {
  const formatter = selectFormatter(undefined);
  assertEquals(typeof formatter, "function");
});

Deno.test("selectFormatter returns a formatter function in production", () => {
  const formatter = selectFormatter("some-deployment-id");
  assertEquals(typeof formatter, "function");
});

// Production path: JSON Lines format
Deno.test("prod formatter output is valid JSON", () => {
  const formatter = selectFormatter("some-deployment-id");
  const output = formatter(makeRecord({ method: "POST" }));
  JSON.parse(output.trim()); // should not throw
});

Deno.test("prod formatter contains standard fields", () => {
  const formatter = selectFormatter("some-deployment-id");
  const output = formatter(makeRecord({}));
  const parsed = JSON.parse(output.trim());
  assertObjectMatch(parsed, {
    level: "INFO",
    message: "Request",
    logger: "scoundrel.http",
  });
  assertEquals(typeof parsed["@timestamp"], "string");
});

Deno.test("prod formatter flattens structured properties to top-level keys", () => {
  const formatter = selectFormatter("some-deployment-id");
  const output = formatter(
    makeRecord({ method: "POST", path: "/api/games", status: 201 }),
  );
  const parsed = JSON.parse(output.trim());
  assertEquals(parsed["method"], "POST");
  assertEquals(parsed["path"], "/api/games");
  assertEquals(parsed["status"], 201);
});

Deno.test("prod formatter with empty properties has only standard fields", () => {
  const formatter = selectFormatter("some-deployment-id");
  const output = formatter(makeRecord({}));
  const parsed = JSON.parse(output.trim());
  const keys = Object.keys(parsed);
  const standardKeys = ["@timestamp", "level", "message", "logger"];
  for (const key of keys) {
    assertEquals(
      standardKeys.includes(key),
      true,
      `Unexpected key: ${key}`,
    );
  }
});

// Dev path: ANSI color text format
Deno.test(
  "dev formatter includes structured properties in output",
  () => {
    const formatter = selectFormatter(undefined);
    const output = formatter(
      makeRecord({ method: "POST", path: "/api/games", status: 201 }),
    );
    assertStringIncludes(output, "method");
    assertStringIncludes(output, "POST");
    assertStringIncludes(output, "path");
    assertStringIncludes(output, "/api/games");
    assertStringIncludes(output, "status");
    assertStringIncludes(output, "201");
  },
);

Deno.test(
  "dev formatter omits properties section when properties is empty",
  () => {
    const formatter = selectFormatter(undefined);
    const output = formatter(makeRecord({}));
    assertEquals(output.includes("{"), false);
  },
);

Deno.test(
  "dev and prod formatters produce different output",
  () => {
    const devFormatter = selectFormatter(undefined);
    const prodFormatter = selectFormatter("some-deployment-id");
    const record = makeRecord({ method: "POST", path: "/api/games" });
    const devOutput = devFormatter(record);
    const prodOutput = prodFormatter(record);
    assertEquals(devOutput === prodOutput, false);
  },
);
