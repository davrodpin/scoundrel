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

Deno.test("selectFormatter returns a formatter function for 'local'", () => {
  const formatter = selectFormatter("local");
  assertEquals(typeof formatter, "function");
});

Deno.test("selectFormatter returns a formatter function for 'production'", () => {
  const formatter = selectFormatter("production");
  assertEquals(typeof formatter, "function");
});

// Production path: JSON Lines format
Deno.test("prod formatter output is valid JSON", () => {
  const formatter = selectFormatter("production");
  const output = formatter(makeRecord({ method: "POST" }));
  JSON.parse(output.trim()); // should not throw
});

Deno.test("prod formatter contains standard fields", () => {
  const formatter = selectFormatter("production");
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
  const formatter = selectFormatter("production");
  const output = formatter(
    makeRecord({ method: "POST", path: "/api/games", status: 201 }),
  );
  const parsed = JSON.parse(output.trim());
  assertEquals(parsed["method"], "POST");
  assertEquals(parsed["path"], "/api/games");
  assertEquals(parsed["status"], 201);
});

Deno.test("prod formatter with empty properties has only standard fields", () => {
  const formatter = selectFormatter("production");
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

// test env uses same JSON format as production
Deno.test("test formatter output is also valid JSON", () => {
  const formatter = selectFormatter("test");
  const output = formatter(makeRecord({ method: "GET" }));
  JSON.parse(output.trim()); // should not throw
});

// Dev path: ANSI color text format
Deno.test(
  "dev formatter includes structured properties in output",
  () => {
    const formatter = selectFormatter("local");
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
    const formatter = selectFormatter("local");
    const output = formatter(makeRecord({}));
    assertEquals(output.includes("{"), false);
  },
);

// Dev and prod produce different output
Deno.test(
  "dev and prod formatters produce different output",
  () => {
    const devFormatter = selectFormatter("local");
    const prodFormatter = selectFormatter("production");
    const record = makeRecord({ method: "POST", path: "/api/games" });
    const devOutput = devFormatter(record);
    const prodOutput = prodFormatter(record);
    assertEquals(devOutput === prodOutput, false);
  },
);
