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
  deploymentId: string | undefined,
): TextFormatter | ReturnType<typeof getJsonLinesFormatter> {
  if (deploymentId) {
    return getJsonLinesFormatter({ properties: "flatten" });
  }
  return getAnsiColorFormatter({
    format({ timestamp, level, category, message, record }) {
      const props = formatProps(record.properties, true);
      return `${timestamp} [${level}] ${category}: ${message}${props}`;
    },
  });
}
