import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OtlpFetchMetricExporter } from "./otlp_fetch_metric_exporter.ts";
import { ImmediateExportingMetricReader } from "./immediate_metric_reader.ts";

let activeMeterProvider: MeterProvider | undefined;

export function createGrafanaMeterProvider(
  url: string,
  headers: Record<string, string>,
  resourceAttributes: Record<string, string>,
): MeterProvider {
  const exporter = new OtlpFetchMetricExporter(url, headers);
  const reader = new ImmediateExportingMetricReader(exporter);
  const resource = resourceFromAttributes(resourceAttributes);
  const provider = new MeterProvider({ resource, readers: [reader] });
  activeMeterProvider = provider;
  return provider;
}

/**
 * Triggers an immediate collection and export of all accumulated metrics.
 * Fire-and-forget — does not block the caller.
 */
export function flushMetrics(): void {
  activeMeterProvider?.forceFlush();
}
