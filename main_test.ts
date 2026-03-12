import { assertEquals, assertStringIncludes } from "@std/assert";
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
  "prod formatter includes structured properties as JSON in output",
  () => {
    const formatter = selectFormatter("some-deployment-id");
    const output = formatter(
      makeRecord({ method: "POST", path: "/api/games", status: 201 }),
    );
    assertStringIncludes(output, '"method"');
    assertStringIncludes(output, '"POST"');
    assertStringIncludes(output, '"path"');
    assertStringIncludes(output, '"/api/games"');
    assertStringIncludes(output, '"status"');
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
  "prod formatter omits properties section when properties is empty",
  () => {
    const formatter = selectFormatter("some-deployment-id");
    const output = formatter(makeRecord({}));
    assertEquals(output.includes("{"), false);
  },
);
