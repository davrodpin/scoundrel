import { App, staticFiles } from "fresh";
import {
  configure,
  getAnsiColorFormatter,
  getConsoleSink,
  getTextFormatter,
  type TextFormatter,
} from "@logtape/logtape";
import { type State } from "./utils.ts";

function formatProps(
  properties: Record<string, unknown>,
  colorize: boolean,
): string {
  if (Object.keys(properties).length === 0) return "";
  return colorize
    ? " " + Deno.inspect(properties, { colors: true })
    : " " + JSON.stringify(properties);
}

export function selectFormatter(
  deploymentId: string | undefined,
): TextFormatter {
  if (deploymentId) {
    return getTextFormatter({
      format({ timestamp, level, category, message, record }) {
        const props = formatProps(record.properties, false);
        return `${timestamp} [${level}] ${category}: ${message}${props}`;
      },
    });
  }
  return getAnsiColorFormatter({
    format({ timestamp, level, category, message, record }) {
      const props = formatProps(record.properties, true);
      return `${timestamp} [${level}] ${category}: ${message}${props}`;
    },
  });
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
