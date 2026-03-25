import { App, staticFiles } from "fresh";
import { configure, getConsoleSink } from "@logtape/logtape";
import { selectFormatter } from "@scoundrel/log-format";
import { config } from "@scoundrel/config";
import { createGrafanaMeterProvider, metrics } from "@scoundrel/telemetry";
import { type State } from "./utils.ts";

export { selectFormatter };

// Populate OTEL_RESOURCE_ATTRIBUTES so Deno Deploy's built-in OTel pipeline
// (traces, metrics, console logs → Deploy dashboard) carries the same service
// identity as our metrics.
Deno.env.set(
  "OTEL_RESOURCE_ATTRIBUTES",
  `service.name=scoundrel,deployment.environment=${config.app.env}`,
);

const formatter = selectFormatter(config.app.env);

if (config.grafana) {
  const credentials = btoa(
    `${config.grafana.instanceId}:${config.grafana.apiToken}`,
  );
  // Build a fetch-based MeterProvider so metrics reach Grafana Cloud via OTLP
  // without depending on Node's http module (unavailable on Deno Deploy).
  const meterProvider = createGrafanaMeterProvider(
    `${config.grafana.endpoint}/v1/metrics`,
    { Authorization: `Basic ${credentials}` },
    {
      "service.name": "scoundrel",
      "deployment.environment": config.app.env,
    },
  );
  metrics.setGlobalMeterProvider(meterProvider);
  console.info("[telemetry] Grafana MeterProvider registered");
} else {
  console.info("[telemetry] Grafana config not found, metrics disabled");
}

await configure({
  sinks: {
    console: getConsoleSink({ formatter }),
  },
  loggers: [
    {
      category: ["scoundrel"],
      lowestLevel: "info",
      sinks: ["console"],
    },
    {
      category: ["logtape", "meta"],
      lowestLevel: "warning",
      sinks: ["console"],
    },
  ],
});

export const app = new App<State>();

app.use(staticFiles());

app.fsRoutes();
