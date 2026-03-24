import { App, staticFiles } from "fresh";
import { configure, getConsoleSink } from "@logtape/logtape";
import { getOpenTelemetrySink } from "@logtape/otel";
import { selectFormatter } from "@scoundrel/log-format";
import { config } from "@scoundrel/config";
import { type State } from "./utils.ts";

export { selectFormatter };

// Derive OTel resource attributes from app config so all signals (logs, traces,
// metrics) share the same identity without requiring manual env var duplication.
Deno.env.set(
  "OTEL_RESOURCE_ATTRIBUTES",
  `service.name=scoundrel,deployment.environment=${config.app.env}`,
);

// Always use protobuf — most efficient and fully supported by Grafana Cloud.
Deno.env.set("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf");

// Build the Authorization header from the Grafana credentials in config.
if (config.grafana) {
  const credentials = btoa(
    `${config.grafana.instanceId}:${config.grafana.apiToken}`,
  );
  Deno.env.set(
    "OTEL_EXPORTER_OTLP_HEADERS",
    `Authorization=Basic ${credentials}`,
  );
}

const formatter = selectFormatter(config.app.env);

if (config.grafana) {
  await configure({
    sinks: {
      console: getConsoleSink({ formatter }),
      otel: getOpenTelemetrySink(),
    },
    loggers: [
      {
        category: ["scoundrel"],
        lowestLevel: "info",
        sinks: ["console", "otel"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
  });
} else {
  await configure({
    sinks: {
      console: getConsoleSink({ formatter }),
    },
    loggers: [
      { category: ["scoundrel"], lowestLevel: "info", sinks: ["console"] },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
  });
}

export const app = new App<State>();

app.use(staticFiles());

app.fsRoutes();
