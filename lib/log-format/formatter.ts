import {
  getAnsiColorFormatter,
  getJsonLinesFormatter,
  type TextFormatter,
} from "@logtape/logtape";

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
  env: "production" | "test" | "local",
): TextFormatter | ReturnType<typeof getJsonLinesFormatter> {
  if (env !== "local") {
    return getJsonLinesFormatter({ properties: "flatten" });
  }
  return getAnsiColorFormatter({
    format({ timestamp, level, category, message, record }) {
      const props = formatProps(record.properties, true);
      return `${timestamp} [${level}] ${category}: ${message}${props}`;
    },
  });
}
