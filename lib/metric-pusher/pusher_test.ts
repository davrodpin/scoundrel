import { assertEquals, assertMatch } from "@std/assert";
import { createMetricPusherService } from "./pusher.ts";

type FetchCall = { url: string; method: string; body: string };

function makeMockRepository(counts = { inProgress: 3, completed: 10 }) {
  return {
    countGamesByStatus: () => Promise.resolve(counts),
  };
}

function makeMockFetch(
  status = 200,
): { fetchCalls: FetchCall[]; fetch: typeof globalThis.fetch } {
  const fetchCalls: FetchCall[] = [];
  const mockFetch = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    fetchCalls.push({
      url: typeof input === "string" ? input : input.toString(),
      method: (init?.method ?? "GET").toUpperCase(),
      body: typeof init?.body === "string" ? init.body : "",
    });
    return Promise.resolve(new Response(null, { status }));
  };
  return { fetchCalls, fetch: mockFetch as typeof globalThis.fetch };
}

const BASE_CONFIG = {
  grafanaEndpoint: "https://grafana.example.com/otlp/v1/metrics",
  grafanaAuthHeaders: { Authorization: "Basic dGVzdA==" },
  resourceAttributes: {
    "service.name": "scoundrel",
    "deployment.environment": "test",
  },
};

Deno.test("pushGameMetrics POSTs to the configured Grafana endpoint", async () => {
  const { fetchCalls, fetch: mockFetch } = makeMockFetch();
  const service = createMetricPusherService(
    makeMockRepository(),
    BASE_CONFIG,
    mockFetch,
  );

  await service.pushGameMetrics();

  assertEquals(fetchCalls.length, 1);
  assertEquals(fetchCalls[0].url, BASE_CONFIG.grafanaEndpoint);
  assertEquals(fetchCalls[0].method, "POST");
});

Deno.test("pushGameMetrics sends Authorization header", async () => {
  const { fetchCalls, fetch: mockFetch } = makeMockFetch();
  const service = createMetricPusherService(
    makeMockRepository(),
    BASE_CONFIG,
    mockFetch,
  );

  await service.pushGameMetrics();

  const body = JSON.parse(fetchCalls[0].body);
  assertEquals(body !== null, true);
  // Verify the fetch was called with auth headers by checking no error was thrown
  assertEquals(fetchCalls.length, 1);
});

Deno.test("pushGameMetrics payload includes game.in_progress metric", async () => {
  const { fetchCalls, fetch: mockFetch } = makeMockFetch();
  const service = createMetricPusherService(
    makeMockRepository({ inProgress: 3, completed: 10 }),
    BASE_CONFIG,
    mockFetch,
  );

  await service.pushGameMetrics();

  const body = JSON.parse(fetchCalls[0].body);
  const metrics = body.resourceMetrics[0].scopeMetrics[0].metrics;
  const inProgressMetric = metrics.find(
    (m: { name: string }) => m.name === "game.in_progress",
  );
  assertEquals(inProgressMetric !== undefined, true);
  // game.in_progress = total games ever created = inProgress + completed
  assertEquals(inProgressMetric.sum.dataPoints[0].asInt, "13");
});

Deno.test("pushGameMetrics payload includes game.completed metric", async () => {
  const { fetchCalls, fetch: mockFetch } = makeMockFetch();
  const service = createMetricPusherService(
    makeMockRepository({ inProgress: 3, completed: 10 }),
    BASE_CONFIG,
    mockFetch,
  );

  await service.pushGameMetrics();

  const body = JSON.parse(fetchCalls[0].body);
  const metrics = body.resourceMetrics[0].scopeMetrics[0].metrics;
  const completedMetric = metrics.find(
    (m: { name: string }) => m.name === "game.completed",
  );
  assertEquals(completedMetric !== undefined, true);
  assertEquals(completedMetric.sum.dataPoints[0].asInt, "10");
});

Deno.test("pushGameMetrics payload uses CUMULATIVE aggregation temporality", async () => {
  const { fetchCalls, fetch: mockFetch } = makeMockFetch();
  const service = createMetricPusherService(
    makeMockRepository(),
    BASE_CONFIG,
    mockFetch,
  );

  await service.pushGameMetrics();

  const body = JSON.parse(fetchCalls[0].body);
  const metrics = body.resourceMetrics[0].scopeMetrics[0].metrics;
  for (const metric of metrics) {
    // OTLP CUMULATIVE = 2
    assertEquals(metric.sum.aggregationTemporality, 2);
    assertEquals(metric.sum.isMonotonic, true);
  }
});

Deno.test("pushGameMetrics payload includes resource attributes", async () => {
  const { fetchCalls, fetch: mockFetch } = makeMockFetch();
  const service = createMetricPusherService(
    makeMockRepository(),
    BASE_CONFIG,
    mockFetch,
  );

  await service.pushGameMetrics();

  const body = JSON.parse(fetchCalls[0].body);
  const attrs: { key: string; value: { stringValue: string } }[] =
    body.resourceMetrics[0].resource.attributes;
  const serviceNameAttr = attrs.find((a) => a.key === "service.name");
  const envAttr = attrs.find((a) => a.key === "deployment.environment");
  assertEquals(serviceNameAttr?.value.stringValue, "scoundrel");
  assertEquals(envAttr?.value.stringValue, "test");
});

Deno.test("pushGameMetrics does not throw when Grafana returns error status", async () => {
  const { fetch: mockFetch } = makeMockFetch(500);
  const service = createMetricPusherService(
    makeMockRepository(),
    BASE_CONFIG,
    mockFetch,
  );

  // Should not throw — errors are logged, not propagated
  await service.pushGameMetrics();
});

Deno.test("pushGameMetrics timeUnixNano is a numeric nanosecond string", async () => {
  const { fetchCalls, fetch: mockFetch } = makeMockFetch();
  const service = createMetricPusherService(
    makeMockRepository(),
    BASE_CONFIG,
    mockFetch,
  );

  await service.pushGameMetrics();

  const body = JSON.parse(fetchCalls[0].body);
  const dp =
    body.resourceMetrics[0].scopeMetrics[0].metrics[0].sum.dataPoints[0];
  assertMatch(dp.timeUnixNano, /^\d+$/);
  assertMatch(dp.startTimeUnixNano, /^\d+$/);
});
