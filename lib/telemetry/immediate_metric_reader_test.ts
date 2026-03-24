import { assertEquals } from "@std/assert";
import {
  AggregationTemporality,
  InstrumentType,
  MeterProvider,
} from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { type ExportResult, ExportResultCode } from "@opentelemetry/core";
import type { ResourceMetrics } from "@opentelemetry/sdk-metrics";
import { ImmediateExportingMetricReader } from "./immediate_metric_reader.ts";

type SpyExporter = {
  calls: ResourceMetrics[];
  export: (
    metrics: ResourceMetrics,
    resultCallback: (result: ExportResult) => void,
  ) => void;
  forceFlush: () => Promise<void>;
  shutdown: () => Promise<void>;
  selectAggregationTemporality: (t: InstrumentType) => AggregationTemporality;
};

function makeSpyExporter(code = ExportResultCode.SUCCESS): SpyExporter {
  const calls: ResourceMetrics[] = [];
  return {
    calls,
    export(metrics, resultCallback) {
      calls.push(metrics);
      resultCallback({ code });
    },
    forceFlush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
    selectAggregationTemporality: () => AggregationTemporality.DELTA,
  };
}

function makeProviderWithReader(exporter: SpyExporter) {
  const reader = new ImmediateExportingMetricReader(exporter);
  const provider = new MeterProvider({
    resource: resourceFromAttributes({ "service.name": "test" }),
    readers: [reader],
  });
  return { reader, provider };
}

Deno.test(
  {
    name:
      "ImmediateExportingMetricReader.forceFlush() calls export on the exporter",
    permissions: {
      env: [
        "OTEL_METRIC_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_METRIC_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION",
        "OTEL_RESOURCE_ATTRIBUTES",
        "OTEL_SERVICE_NAME",
      ],
    },
  },
  async () => {
    const exporter = makeSpyExporter();
    const { provider } = await makeProviderWithReader(exporter);

    const meter = provider.getMeter("test");
    const counter = meter.createCounter("test.counter");
    counter.add(1);

    await provider.forceFlush();
    assertEquals(exporter.calls.length, 1);

    await provider.shutdown();
  },
);

Deno.test(
  {
    name:
      "ImmediateExportingMetricReader does not call export when no metrics recorded",
    permissions: {
      env: [
        "OTEL_METRIC_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_METRIC_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION",
        "OTEL_RESOURCE_ATTRIBUTES",
        "OTEL_SERVICE_NAME",
      ],
    },
  },
  async () => {
    const exporter = makeSpyExporter();
    const { provider } = await makeProviderWithReader(exporter);

    await provider.forceFlush();
    assertEquals(exporter.calls.length, 0);

    await provider.shutdown();
  },
);

Deno.test(
  {
    name:
      "ImmediateExportingMetricReader.selectAggregationTemporality delegates to exporter",
    permissions: {
      env: [
        "OTEL_METRIC_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
        "OTEL_METRIC_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_ATTRIBUTE_COUNT_LIMIT",
        "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_TEMPORALITY_PREFERENCE",
        "OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION",
        "OTEL_RESOURCE_ATTRIBUTES",
        "OTEL_SERVICE_NAME",
      ],
    },
  },
  () => {
    const exporter = makeSpyExporter();
    const reader = new ImmediateExportingMetricReader(exporter);
    assertEquals(
      reader.selectAggregationTemporality(InstrumentType.COUNTER),
      AggregationTemporality.DELTA,
    );
  },
);
