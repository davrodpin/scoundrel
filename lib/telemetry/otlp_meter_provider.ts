import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OtlpFetchMetricExporter } from "./otlp_fetch_metric_exporter.ts";

export function createGrafanaMeterProvider(
  url: string,
  headers: Record<string, string>,
  resourceAttributes: Record<string, string>,
): MeterProvider {
  const exporter = new OtlpFetchMetricExporter(url, headers);
  const reader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 60_000,
  });
  const resource = resourceFromAttributes(resourceAttributes);
  return new MeterProvider({ resource, readers: [reader] });
}
