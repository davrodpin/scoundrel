import { getJsonLinesFormatter } from "@logtape/logtape";

export function selectFormatter(
  _deploymentId: string | undefined,
): ReturnType<typeof getJsonLinesFormatter> {
  return getJsonLinesFormatter({ properties: "flatten" });
}
