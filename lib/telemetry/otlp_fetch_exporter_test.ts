import { assertEquals, assertStringIncludes } from "@std/assert";
import type { ReadableLogRecord } from "@opentelemetry/sdk-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OtlpFetchLogExporter } from "./otlp_fetch_exporter.ts";

function makeLogRecord(
  overrides: Partial<ReadableLogRecord> = {},
): ReadableLogRecord {
  return {
    hrTime: [1704067200, 0],
    hrTimeObserved: [1704067200, 0],
    severityNumber: 9,
    severityText: "INFO",
    body: "Test log message",
    resource: resourceFromAttributes({
      "service.name": "scoundrel",
      "deployment.environment": "test",
    }),
    instrumentationScope: { name: "scoundrel", version: "1.0.0" },
    attributes: { method: "GET", path: "/api/games" },
    droppedAttributesCount: 0,
    ...overrides,
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

Deno.test("OtlpFetchLogExporter.export() POSTs to the configured URL with correct headers", async () => {
  const { calls } = mockFetch(200);
  const exporter = new OtlpFetchLogExporter(
    "https://otlp.grafana.net/otlp/v1/logs",
    { Authorization: "Basic abc123" },
  );

  await new Promise<void>((resolve) => {
    exporter.export([makeLogRecord()], () => resolve());
  });

  assertEquals(calls.length, 1);
  assertEquals(calls[0].url, "https://otlp.grafana.net/otlp/v1/logs");
  assertEquals(calls[0].options.method, "POST");
  assertEquals(
    (calls[0].options.headers as Record<string, string>)["Authorization"],
    "Basic abc123",
  );
  assertEquals(
    (calls[0].options.headers as Record<string, string>)["Content-Type"],
    "application/json",
  );
});

Deno.test("OtlpFetchLogExporter.export() sends log data as OTLP JSON", async () => {
  const { calls } = mockFetch(200);
  const exporter = new OtlpFetchLogExporter(
    "https://otlp.grafana.net/otlp/v1/logs",
    { Authorization: "Basic abc123" },
  );

  await new Promise<void>((resolve) => {
    exporter.export([makeLogRecord()], () => resolve());
  });

  const body = calls[0].options.body as string;
  const parsed = JSON.parse(body);
  assertStringIncludes(body, "resourceLogs");
  assertStringIncludes(body, "scopeLogs");
  assertStringIncludes(body, "logRecords");
  assertStringIncludes(body, "Test log message");
  assertEquals(
    parsed.resourceLogs[0].scopeLogs[0].logRecords[0].severityNumber,
    9,
  );
  assertEquals(
    parsed.resourceLogs[0].scopeLogs[0].logRecords[0].severityText,
    "INFO",
  );
});

Deno.test("OtlpFetchLogExporter.export() calls resultCallback with SUCCESS (code 0) on HTTP 200", async () => {
  mockFetch(200);
  const exporter = new OtlpFetchLogExporter(
    "https://otlp.grafana.net/otlp/v1/logs",
    { Authorization: "Basic abc123" },
  );

  const result = await new Promise<{ code: number }>((resolve) => {
    exporter.export([makeLogRecord()], (r) => resolve(r));
  });

  assertEquals(result.code, 0);
});

Deno.test("OtlpFetchLogExporter.export() calls resultCallback with FAILED (code 1) on HTTP 5xx", async () => {
  mockFetch(500);
  const exporter = new OtlpFetchLogExporter(
    "https://otlp.grafana.net/otlp/v1/logs",
    { Authorization: "Basic abc123" },
  );

  const result = await new Promise<{ code: number; error?: Error }>(
    (resolve) => {
      exporter.export([makeLogRecord()], (r) => resolve(r));
    },
  );

  assertEquals(result.code, 1);
  assertEquals(result.error instanceof Error, true);
});

Deno.test("OtlpFetchLogExporter.export() calls resultCallback with FAILED on network error", async () => {
  globalThis.fetch = () => Promise.reject(new Error("Network failure"));
  const exporter = new OtlpFetchLogExporter(
    "https://otlp.grafana.net/otlp/v1/logs",
    { Authorization: "Basic abc123" },
  );

  const result = await new Promise<{ code: number; error?: Error }>(
    (resolve) => {
      exporter.export([makeLogRecord()], (r) => resolve(r));
    },
  );

  assertEquals(result.code, 1);
  assertEquals(result.error?.message, "Network failure");
});

Deno.test("OtlpFetchLogExporter.export() skips fetch and returns SUCCESS when logs array is empty", async () => {
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    return Promise.resolve(new Response(null, { status: 200 }));
  };
  const exporter = new OtlpFetchLogExporter(
    "https://otlp.grafana.net/otlp/v1/logs",
    { Authorization: "Basic abc123" },
  );

  const result = await new Promise<{ code: number }>((resolve) => {
    exporter.export([], (r) => resolve(r));
  });

  assertEquals(result.code, 0);
  assertEquals(fetchCalled, false);
});

Deno.test("OtlpFetchLogExporter.shutdown() resolves", async () => {
  const exporter = new OtlpFetchLogExporter(
    "https://otlp.grafana.net/otlp/v1/logs",
    { Authorization: "Basic abc123" },
  );
  await exporter.shutdown(); // should not throw
});
