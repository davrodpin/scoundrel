import { App, staticFiles } from "fresh";
import {
  configure,
  getConsoleSink,
  jsonLinesFormatter,
} from "@logtape/logtape";
import { type State } from "./utils.ts";

await configure({
  sinks: {
    console: getConsoleSink({ formatter: jsonLinesFormatter }),
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
