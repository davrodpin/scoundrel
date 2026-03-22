import { App, staticFiles } from "fresh";
import { configure, getConsoleSink } from "@logtape/logtape";
import { selectFormatter } from "@scoundrel/log-format";
import { config } from "@scoundrel/config";
import { createAxiomSink } from "@scoundrel/axiom";
import { type State } from "./utils.ts";

export { selectFormatter };

const formatter = selectFormatter(config.deploy.id);

export const axiom = config.axiom ? createAxiomSink(config.axiom) : null;

if (axiom) {
  await configure({
    sinks: {
      console: getConsoleSink({ formatter }),
      axiom: axiom.sink,
    },
    loggers: [
      {
        category: ["scoundrel"],
        lowestLevel: "info",
        sinks: ["console", "axiom"],
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
}

export const app = new App<State>();

app.use(staticFiles());

app.fsRoutes();
