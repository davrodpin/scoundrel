import { assertEquals, assertObjectMatch } from "@std/assert";
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

Deno.test("formatter output is valid JSON", () => {
  const formatter = selectFormatter(undefined);
  const output = formatter(makeRecord({ method: "POST" }));
  // Should not throw
  JSON.parse(output.trim());
});

Deno.test("formatter contains standard fields", () => {
  const formatter = selectFormatter(undefined);
  const output = formatter(makeRecord({}));
  const parsed = JSON.parse(output.trim());
  assertObjectMatch(parsed, {
    level: "INFO",
    message: "Request",
    logger: "scoundrel.http",
  });
  assertEquals(typeof parsed["@timestamp"], "string");
});

Deno.test("formatter flattens structured properties to top-level keys", () => {
  const formatter = selectFormatter(undefined);
  const output = formatter(
    makeRecord({ method: "POST", path: "/api/games", status: 201 }),
  );
  const parsed = JSON.parse(output.trim());
  assertEquals(parsed["method"], "POST");
  assertEquals(parsed["path"], "/api/games");
  assertEquals(parsed["status"], 201);
});

Deno.test("formatter with empty properties has only standard fields", () => {
  const formatter = selectFormatter(undefined);
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

Deno.test(
  "selectFormatter produces identical output regardless of deploymentId",
  () => {
    const devFormatter = selectFormatter(undefined);
    const prodFormatter = selectFormatter("some-deployment-id");
    const record = makeRecord({ method: "POST", path: "/api/games" });
    const devOutput = JSON.parse(devFormatter(record).trim());
    const prodOutput = JSON.parse(prodFormatter(record).trim());
    assertEquals(devOutput, prodOutput);
  },
);
