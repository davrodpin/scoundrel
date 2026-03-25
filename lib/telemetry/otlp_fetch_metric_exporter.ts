import {
  AggregationTemporality,
  DataPointType,
  InstrumentType,
  type PushMetricExporter,
  type ResourceMetrics,
} from "@opentelemetry/sdk-metrics";
import { type ExportResult, ExportResultCode } from "@opentelemetry/core";
import type { HrTime } from "@opentelemetry/api";
import { getLogger } from "@logtape/logtape";

type OtlpAnyValue =
  | { stringValue: string }
  | { intValue: string }
  | { doubleValue: number }
  | { boolValue: boolean };

function toOtlpValue(v: unknown): OtlpAnyValue {
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") {
    if (Number.isInteger(v)) return { intValue: String(v) };
    return { doubleValue: v };
  }
  if (typeof v === "boolean") return { boolValue: v };
  return { stringValue: String(v) };
}

type OtlpKeyValue = { key: string; value: OtlpAnyValue };

function toOtlpAttributes(
  attrs: Record<string, unknown>,
): OtlpKeyValue[] {
  return Object.entries(attrs)
    .filter(([, v]) => v != null)
    .map(([key, value]) => ({
      key,
      value: Array.isArray(value)
        ? { stringValue: JSON.stringify(value) }
        : toOtlpValue(value),
    }));
}

function hrTimeToNanoString([seconds, nanos]: HrTime): string {
  // Use BigInt to avoid precision loss: current Unix time in nanoseconds
  // (~1.748e18) exceeds Number.MAX_SAFE_INTEGER (~9e15).
  return (
    BigInt(Math.floor(seconds)) * 1_000_000_000n + BigInt(nanos)
  ).toString();
}

// SDK AggregationTemporality.DELTA=0, CUMULATIVE=1
// OTLP proto: DELTA=1, CUMULATIVE=2
function toOtlpTemporality(t: AggregationTemporality): number {
  return t === AggregationTemporality.DELTA ? 1 : 2;
}

export class OtlpFetchMetricExporter implements PushMetricExporter {
  readonly #url: string;
  readonly #headers: Record<string, string>;
  readonly #logger = getLogger(["scoundrel", "telemetry"]);

  constructor(url: string, headers: Record<string, string>) {
    this.#url = url;
    this.#headers = headers;
  }

  export(
    metrics: ResourceMetrics,
    resultCallback: (result: ExportResult) => void,
  ): void {
    if (metrics.scopeMetrics.length === 0) {
      resultCallback({ code: ExportResultCode.SUCCESS });
      return;
    }

    const payload = this.#buildPayload(metrics);

    fetch(this.#url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.#headers },
      body: JSON.stringify(payload),
    }).then((response) => {
      if (response.ok) {
        this.#logger.debug("metrics exported {scopes} scope(s)", {
          scopes: metrics.scopeMetrics.length,
        });
        resultCallback({ code: ExportResultCode.SUCCESS });
      } else {
        response.text().then((body) => {
          const err = new Error(
            `OTLP metrics export failed with HTTP ${response.status}: ${body}`,
          );
          console.error("[otlp]", err.message);
          resultCallback({ code: ExportResultCode.FAILED, error: err });
        }).catch(() => {
          const err = new Error(
            `OTLP metrics export failed with HTTP ${response.status}`,
          );
          console.error("[otlp]", err.message);
          resultCallback({ code: ExportResultCode.FAILED, error: err });
        });
      }
    }).catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[otlp] metrics export network error:", err.message);
      resultCallback({ code: ExportResultCode.FAILED, error: err });
    });
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  selectAggregationTemporality(
    _instrumentType: InstrumentType,
  ): AggregationTemporality {
    // Grafana Cloud (Mimir) requires CUMULATIVE temporality — DELTA is rejected
    // with HTTP 400 "invalid temporality and type combination".
    return AggregationTemporality.CUMULATIVE;
  }

  #buildPayload(metrics: ResourceMetrics) {
    const resourceAttrs = toOtlpAttributes(
      metrics.resource.attributes as Record<string, unknown>,
    );

    const scopeMetrics = metrics.scopeMetrics.map((scope) => ({
      scope: { name: scope.scope.name, version: scope.scope.version },
      metrics: scope.metrics.map((metric) => {
        const base = {
          name: metric.descriptor.name,
          unit: metric.descriptor.unit,
        };
        if (metric.dataPointType === DataPointType.SUM) {
          return {
            ...base,
            sum: {
              dataPoints: metric.dataPoints.map((dp) => ({
                attributes: toOtlpAttributes(
                  dp.attributes as Record<string, unknown>,
                ),
                startTimeUnixNano: hrTimeToNanoString(dp.startTime),
                timeUnixNano: hrTimeToNanoString(dp.endTime),
                asInt: String(dp.value),
              })),
              aggregationTemporality: toOtlpTemporality(
                metric.aggregationTemporality,
              ),
              isMonotonic: metric.isMonotonic,
            },
          };
        }
        if (metric.dataPointType === DataPointType.HISTOGRAM) {
          return {
            ...base,
            histogram: {
              dataPoints: metric.dataPoints.map((dp) => {
                const h = dp.value;
                return {
                  attributes: toOtlpAttributes(
                    dp.attributes as Record<string, unknown>,
                  ),
                  startTimeUnixNano: hrTimeToNanoString(dp.startTime),
                  timeUnixNano: hrTimeToNanoString(dp.endTime),
                  count: String(h.count),
                  sum: h.sum,
                  min: h.min,
                  max: h.max,
                  bucketCounts: h.buckets.counts.map(String),
                  explicitBounds: h.buckets.boundaries,
                };
              }),
              aggregationTemporality: toOtlpTemporality(
                metric.aggregationTemporality,
              ),
            },
          };
        }
        return base;
      }),
    }));

    return {
      resourceMetrics: [
        {
          resource: { attributes: resourceAttrs },
          scopeMetrics,
        },
      ],
    };
  }
}
