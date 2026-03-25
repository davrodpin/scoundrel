import {
  AggregationTemporality,
  MetricReader,
  type MetricReaderOptions,
  type PushMetricExporter,
} from "@opentelemetry/sdk-metrics";

/**
 * A MetricReader that exports immediately when forceFlush() is called.
 * Unlike PeriodicExportingMetricReader, it has no internal timer — it only
 * exports when explicitly triggered. This is appropriate for Deno Deploy where
 * isolates are short-lived and timer-based export never fires.
 */
export class ImmediateExportingMetricReader extends MetricReader {
  readonly #exporter: PushMetricExporter;

  constructor(
    exporter: PushMetricExporter,
    options?: Omit<MetricReaderOptions, "aggregationTemporalitySelector">,
  ) {
    super({
      ...options,
      aggregationTemporalitySelector:
        exporter.selectAggregationTemporality?.bind(exporter) ??
          (() => AggregationTemporality.CUMULATIVE),
    });
    this.#exporter = exporter;
  }

  protected async onForceFlush(): Promise<void> {
    const { resourceMetrics } = await this.collect();
    if (resourceMetrics.scopeMetrics.length === 0) {
      console.debug(
        "[otlp] collect() returned 0 scope metrics, skipping export",
      );
      return;
    }
    await new Promise<void>((resolve) => {
      this.#exporter.export(resourceMetrics, () => resolve());
    });
  }

  protected async onShutdown(): Promise<void> {
    await this.onForceFlush();
    await this.#exporter.shutdown();
  }
}
