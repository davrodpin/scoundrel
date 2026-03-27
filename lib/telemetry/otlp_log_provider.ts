import { type LogRecord } from "@logtape/logtape";
import { OtlpFetchLogExporter } from "./otlp_fetch_log_exporter.ts";

let activeLogExporter: OtlpFetchLogExporter | undefined;

export function createGrafanaLogProvider(
  url: string,
  headers: Record<string, string>,
  resourceAttributes: Record<string, string>,
): OtlpFetchLogExporter {
  const exporter = new OtlpFetchLogExporter(url, headers, resourceAttributes);
  activeLogExporter = exporter;
  return exporter;
}

export function getGrafanaLogSink():
  | ((record: LogRecord) => void)
  | undefined {
  return activeLogExporter?.sink();
}

export function flushLogs(): Promise<void> {
  if (!activeLogExporter) {
    return Promise.resolve();
  }
  return activeLogExporter.flush();
}
