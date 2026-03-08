import { App, staticFiles } from "fresh";
import {
  ansiColorFormatter,
  configure,
  defaultTextFormatter,
  type Formatter,
  getConsoleSink,
} from "@logtape/logtape";
import { type State } from "./utils.ts";

export function selectFormatter(deploymentId: string | undefined): Formatter {
  return deploymentId ? defaultTextFormatter : ansiColorFormatter;
}

const formatter = selectFormatter(Deno.env.get("DENO_DEPLOYMENT_ID"));

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

export const app = new App<State>();

app.use(staticFiles());

app.fsRoutes();
