import { App, staticFiles } from "fresh";
import { configure, getConsoleSink, type Sink } from "@logtape/logtape";
import { selectFormatter } from "@scoundrel/log-format";
import { config } from "@scoundrel/config";
import {
  createGrafanaLogProvider,
  createGrafanaMeterProvider,
  getGrafanaLogSink,
} from "@scoundrel/telemetry";
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
  const resourceAttributes = {
    "service.name": "scoundrel",
    "deployment.environment": config.app.env,
  };
  const authHeaders = { Authorization: `Basic ${credentials}` };

  // Build a fetch-based MeterProvider so metrics reach Grafana Cloud via OTLP
  // without depending on Node's http module (unavailable on Deno Deploy).
  createGrafanaMeterProvider(
    `${config.grafana.endpoint}/v1/metrics`,
    authHeaders,
    resourceAttributes,
  );
  console.info("[telemetry] Grafana MeterProvider registered");

  // Build a fetch-based log exporter so logs reach Grafana Cloud via OTLP.
  createGrafanaLogProvider(
    `${config.grafana.endpoint}/v1/logs`,
    authHeaders,
    resourceAttributes,
  );
  console.info("[telemetry] Grafana log provider registered");
} else {
  console.info(
    "[telemetry] Grafana config not found, metrics and logs disabled",
  );
}

const sinks: Record<string, Sink> = {
  console: getConsoleSink({ formatter }),
};

const grafanaLogSink = getGrafanaLogSink();
if (grafanaLogSink) {
  sinks.grafana = grafanaLogSink;
}

const scoundrelSinks = grafanaLogSink ? ["console", "grafana"] : ["console"];

await configure({
  sinks,
  loggers: [
    {
      category: ["scoundrel"],
      lowestLevel: "info",
      sinks: scoundrelSinks,
    },
    {
      // Keep meta logs console-only to avoid infinite recursion if the
      // log exporter itself triggers LogTape meta-logging.
      category: ["logtape", "meta"],
      lowestLevel: "warning",
      sinks: ["console"],
    },
  ],
});

export const app = new App<State>();

app.use(staticFiles());

app.fsRoutes();
