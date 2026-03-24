import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OtlpFetchLogExporter } from "./otlp_fetch_exporter.ts";

export function createGrafanaLoggerProvider(
  url: string,
  headers: Record<string, string>,
  resourceAttributes: Record<string, string>,
): LoggerProvider {
  const exporter = new OtlpFetchLogExporter(url, headers);
  const resource = resourceFromAttributes(resourceAttributes);
  const provider = new LoggerProvider({
    resource,
    processors: [new SimpleLogRecordProcessor(exporter)],
  });
  return provider;
}
