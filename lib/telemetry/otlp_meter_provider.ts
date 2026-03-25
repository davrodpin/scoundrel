import type { Meter } from "@opentelemetry/api";
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
 * Awaiting the returned promise ensures the export completes before the
 * caller continues — important on Deno Deploy where isolates may be frozen
 * as soon as the response is sent.
 */
/**
 * Returns a Meter directly from the active Grafana MeterProvider, bypassing
 * the OTel global API. This avoids recording into a different provider that
 * may have been registered first (e.g. Deno Deploy's built-in OTel support).
 */
export function getMeter(): Meter | undefined {
  return activeMeterProvider?.getMeter("scoundrel", "1.0.0");
}

export function flushMetrics(): Promise<void> {
  if (!activeMeterProvider) {
    console.debug("[otlp] flushMetrics called but no active MeterProvider");
    return Promise.resolve();
  }
  return activeMeterProvider.forceFlush();
}
