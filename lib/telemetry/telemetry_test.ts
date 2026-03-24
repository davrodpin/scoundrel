import { assertEquals } from "@std/assert";
import { getTracer } from "./telemetry.ts";
import { createGrafanaLoggerProvider } from "./otlp_logger_provider.ts";

Deno.test("getTracer returns an object with startActiveSpan method", () => {
  const tracer = getTracer();
  assertEquals(typeof tracer.startActiveSpan, "function");
});

Deno.test("getTracer returns an object with startSpan method", () => {
  const tracer = getTracer();
  assertEquals(typeof tracer.startSpan, "function");
});

Deno.test(
  {
    name:
      "createGrafanaLoggerProvider returns a LoggerProvider with getLogger method",
    permissions: {
      env: [
        "OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_ATTRIBUTE_COUNT_LIMIT",
      ],
    },
  },
  () => {
    const provider = createGrafanaLoggerProvider(
      "https://otlp.grafana.net/otlp/v1/logs",
      { Authorization: "Basic abc123" },
      { "service.name": "scoundrel", "deployment.environment": "test" },
    );
    assertEquals(typeof provider.getLogger, "function");
  },
);
