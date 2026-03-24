import { assertEquals } from "@std/assert";
import { createGrafanaMeterProvider } from "./otlp_meter_provider.ts";

Deno.test(
  {
    name:
      "createGrafanaMeterProvider returns a MeterProvider with getMeter method",
    permissions: {
      env: [
        "OTEL_METRIC_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_METRIC_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION",
        "OTEL_RESOURCE_ATTRIBUTES",
        "OTEL_SERVICE_NAME",
      ],
    },
  },
  async () => {
    const provider = createGrafanaMeterProvider(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
      { "service.name": "scoundrel", "deployment.environment": "test" },
    );
    assertEquals(typeof provider.getMeter, "function");
    await provider.shutdown();
  },
);
