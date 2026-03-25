import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  AggregationTemporality,
  DataPointType,
  InstrumentType,
  type ResourceMetrics,
} from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OtlpFetchMetricExporter } from "./otlp_fetch_metric_exporter.ts";

const SCOPE = { name: "scoundrel", version: "1.0.0" };

function makeResource() {
  return resourceFromAttributes({
    "service.name": "scoundrel",
    "deployment.environment": "test",
  });
}

function makeSumResourceMetrics(): ResourceMetrics {
  return {
    resource: makeResource(),
    scopeMetrics: [
      {
        scope: SCOPE,
        metrics: [
          {
            descriptor: {
              name: "http.server.request.count",
              description: "Number of HTTP requests",
              unit: "{request}",
              valueType: 1,
            },
            dataPointType: DataPointType.SUM,
            aggregationTemporality: AggregationTemporality.CUMULATIVE,
            dataPoints: [
              {
                attributes: {
                  "http.request.method": "GET",
                  "http.route": "/api/games",
                  "http.response.status_code": 200,
                },
                startTime: [1704067200, 0],
                endTime: [1704067260, 0],
                value: 42,
              },
            ],
            isMonotonic: true,
          },
        ],
      },
    ],
  };
}

function makeHistogramResourceMetrics(): ResourceMetrics {
  return {
    resource: makeResource(),
    scopeMetrics: [
      {
        scope: SCOPE,
        metrics: [
          {
            descriptor: {
              name: "http.server.request.duration",
              description: "HTTP request duration",
              unit: "ms",
              valueType: 0,
            },
            dataPointType: DataPointType.HISTOGRAM,
            aggregationTemporality: AggregationTemporality.CUMULATIVE,
            dataPoints: [
              {
                attributes: {
                  "http.request.method": "POST",
                  "http.route": "/api/games",
                  "http.response.status_code": 200,
                },
                startTime: [1704067200, 0],
                endTime: [1704067260, 0],
                value: {
                  count: 15,
                  sum: 1250.5,
                  min: 3.2,
                  max: 230.1,
                  buckets: {
                    boundaries: [5, 10, 25, 50, 100, 250],
                    counts: [0, 2, 5, 4, 3, 1, 0],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function makeEmptyResourceMetrics(): ResourceMetrics {
  return {
    resource: makeResource(),
    scopeMetrics: [],
  };
}

function mockFetch(
  status: number,
): { calls: { url: string; options: RequestInit }[] } {
  const calls: { url: string; options: RequestInit }[] = [];
  globalThis.fetch = (url: string | URL | Request, options?: RequestInit) => {
    calls.push({ url: url.toString(), options: options ?? {} });
    return Promise.resolve(new Response(null, { status }));
  };
  return { calls };
}

Deno.test(
  "OtlpFetchMetricExporter.export() POSTs to the configured URL with correct headers",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );

    await new Promise<void>((resolve) => {
      exporter.export(makeSumResourceMetrics(), () => resolve());
    });

    assertEquals(calls.length, 1);
    assertEquals(calls[0].url, "https://otlp.grafana.net/otlp/v1/metrics");
    assertEquals(calls[0].options.method, "POST");
    assertEquals(
      (calls[0].options.headers as Record<string, string>)["Authorization"],
      "Basic abc123",
    );
    assertEquals(
      (calls[0].options.headers as Record<string, string>)["Content-Type"],
      "application/json",
    );
  },
);

Deno.test(
  "OtlpFetchMetricExporter.export() serializes a Counter as OTLP JSON sum",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );

    await new Promise<void>((resolve) => {
      exporter.export(makeSumResourceMetrics(), () => resolve());
    });

    const body = calls[0].options.body as string;
    const parsed = JSON.parse(body);
    assertStringIncludes(body, "resourceMetrics");
    assertStringIncludes(body, "scopeMetrics");
    assertStringIncludes(body, "http.server.request.count");

    const metric = parsed.resourceMetrics[0].scopeMetrics[0].metrics[0];
    assertEquals(metric.name, "http.server.request.count");
    assertEquals(metric.sum.isMonotonic, true);
    assertEquals(metric.sum.aggregationTemporality, 2); // CUMULATIVE
    assertEquals(metric.sum.dataPoints[0].asInt, "42");
    assertEquals(
      metric.sum.dataPoints[0].attributes[0].key,
      "http.request.method",
    );
  },
);

Deno.test(
  "OtlpFetchMetricExporter.export() serializes a Histogram as OTLP JSON histogram",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );

    await new Promise<void>((resolve) => {
      exporter.export(makeHistogramResourceMetrics(), () => resolve());
    });

    const body = calls[0].options.body as string;
    const parsed = JSON.parse(body);
    assertStringIncludes(body, "http.server.request.duration");

    const metric = parsed.resourceMetrics[0].scopeMetrics[0].metrics[0];
    assertEquals(metric.name, "http.server.request.duration");
    assertEquals(metric.histogram.aggregationTemporality, 2); // CUMULATIVE
    assertEquals(metric.histogram.dataPoints[0].count, "15");
    assertEquals(metric.histogram.dataPoints[0].sum, 1250.5);
    assertEquals(metric.histogram.dataPoints[0].min, 3.2);
    assertEquals(metric.histogram.dataPoints[0].max, 230.1);
    assertEquals(metric.histogram.dataPoints[0].bucketCounts, [
      "0",
      "2",
      "5",
      "4",
      "3",
      "1",
      "0",
    ]);
    assertEquals(metric.histogram.dataPoints[0].explicitBounds, [
      5,
      10,
      25,
      50,
      100,
      250,
    ]);
  },
);

Deno.test(
  "OtlpFetchMetricExporter.export() calls resultCallback with SUCCESS (code 0) on HTTP 200",
  async () => {
    mockFetch(200);
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );

    const result = await new Promise<{ code: number }>((resolve) => {
      exporter.export(makeSumResourceMetrics(), (r) => resolve(r));
    });

    assertEquals(result.code, 0);
  },
);

Deno.test(
  "OtlpFetchMetricExporter.export() calls resultCallback with FAILED (code 1) on HTTP 5xx",
  async () => {
    mockFetch(500);
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );

    const result = await new Promise<{ code: number; error?: Error }>(
      (resolve) => {
        exporter.export(makeSumResourceMetrics(), (r) => resolve(r));
      },
    );

    assertEquals(result.code, 1);
    assertEquals(result.error instanceof Error, true);
  },
);

Deno.test(
  "OtlpFetchMetricExporter.export() calls resultCallback with FAILED on network error",
  async () => {
    globalThis.fetch = () => Promise.reject(new Error("Network failure"));
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );

    const result = await new Promise<{ code: number; error?: Error }>(
      (resolve) => {
        exporter.export(makeSumResourceMetrics(), (r) => resolve(r));
      },
    );

    assertEquals(result.code, 1);
    assertEquals(result.error?.message, "Network failure");
  },
);

Deno.test(
  "OtlpFetchMetricExporter.export() skips fetch and returns SUCCESS when scopeMetrics is empty",
  async () => {
    let fetchCalled = false;
    globalThis.fetch = () => {
      fetchCalled = true;
      return Promise.resolve(new Response(null, { status: 200 }));
    };
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );

    const result = await new Promise<{ code: number }>((resolve) => {
      exporter.export(makeEmptyResourceMetrics(), (r) => resolve(r));
    });

    assertEquals(result.code, 0);
    assertEquals(fetchCalled, false);
  },
);

Deno.test("OtlpFetchMetricExporter.shutdown() resolves", async () => {
  const exporter = new OtlpFetchMetricExporter(
    "https://otlp.grafana.net/otlp/v1/metrics",
    { Authorization: "Basic abc123" },
  );
  await exporter.shutdown();
});

Deno.test("OtlpFetchMetricExporter.forceFlush() resolves", async () => {
  const exporter = new OtlpFetchMetricExporter(
    "https://otlp.grafana.net/otlp/v1/metrics",
    { Authorization: "Basic abc123" },
  );
  await exporter.forceFlush();
});

Deno.test(
  "OtlpFetchMetricExporter.selectAggregationTemporality() returns CUMULATIVE",
  () => {
    const exporter = new OtlpFetchMetricExporter(
      "https://otlp.grafana.net/otlp/v1/metrics",
      { Authorization: "Basic abc123" },
    );
    assertEquals(
      exporter.selectAggregationTemporality(InstrumentType.COUNTER),
      AggregationTemporality.CUMULATIVE,
    );
  },
);
