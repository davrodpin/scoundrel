import { App, staticFiles } from "fresh";
import { configure, getConsoleSink } from "@logtape/logtape";
import { getOpenTelemetrySink } from "@logtape/otel";
import { selectFormatter } from "@scoundrel/log-format";
import { config } from "@scoundrel/config";
import { createGrafanaLoggerProvider } from "@scoundrel/telemetry";
import { type State } from "./utils.ts";

export { selectFormatter };

// Populate OTEL_RESOURCE_ATTRIBUTES so Deno Deploy's built-in OTel pipeline
// (traces, metrics, console logs → Deploy dashboard) carries the same service
// identity as our @logtape/otel structured log sink.
Deno.env.set(
  "OTEL_RESOURCE_ATTRIBUTES",
  `service.name=scoundrel,deployment.environment=${config.app.env}`,
);

const formatter = selectFormatter(config.app.env);

if (config.grafana) {
  const credentials = btoa(
    `${config.grafana.instanceId}:${config.grafana.apiToken}`,
  );
  // Build a fetch-based LoggerProvider so logs reach Grafana Cloud via OTLP
  // without depending on Node's http module (unavailable on Deno Deploy).
  const loggerProvider = createGrafanaLoggerProvider(
    `${config.grafana.endpoint}/v1/logs`,
    { Authorization: `Basic ${credentials}` },
    {
      "service.name": "scoundrel",
      "deployment.environment": config.app.env,
    },
  );

  await configure({
    sinks: {
      console: getConsoleSink({ formatter }),
      otel: getOpenTelemetrySink({ loggerProvider }),
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
