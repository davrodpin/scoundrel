import { App, staticFiles } from "fresh";
import { configure, getConsoleSink } from "@logtape/logtape";
import { selectFormatter } from "@scoundrel/log-format";
import { type State } from "./utils.ts";

export { selectFormatter };

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
