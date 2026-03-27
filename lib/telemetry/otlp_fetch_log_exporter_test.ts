import { assertEquals, assertStringIncludes } from "@std/assert";
import { configure, type LogRecord } from "@logtape/logtape";
import { OtlpFetchLogExporter } from "./otlp_fetch_log_exporter.ts";

function makeLogRecord(
  overrides: Partial<LogRecord> = {},
): LogRecord {
  return {
    category: ["scoundrel", "http"],
    level: "info",
    message: ["Request processed"],
    rawMessage: "Request processed",
    properties: { method: "GET", status: 200 },
    timestamp: 1704067260000,
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

Deno.test(
  "OtlpFetchLogExporter.flush() POSTs to the configured URL with correct headers",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      { Authorization: "Basic abc123" },
      { "service.name": "scoundrel", "deployment.environment": "test" },
    );
    const sink = exporter.sink();
    sink(makeLogRecord());

    await exporter.flush();

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
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() serializes log records into OTLP JSON",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      { Authorization: "Basic abc123" },
      { "service.name": "scoundrel", "deployment.environment": "test" },
    );
    const sink = exporter.sink();
    sink(makeLogRecord());

    await exporter.flush();

    const body = calls[0].options.body as string;
    const parsed = JSON.parse(body);
    assertStringIncludes(body, "resourceLogs");
    assertStringIncludes(body, "scopeLogs");
    assertStringIncludes(body, "logRecords");

    const resourceLog = parsed.resourceLogs[0];
    assertEquals(
      resourceLog.resource.attributes.find((a: { key: string }) =>
        a.key === "service.name"
      )?.value,
      { stringValue: "scoundrel" },
    );

    const logRecord = resourceLog.scopeLogs[0].logRecords[0];
    assertEquals(logRecord.body, { stringValue: "Request processed" });
    assertEquals(logRecord.severityNumber, 9);
    assertEquals(logRecord.severityText, "INFO");
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() maps LogTape levels to OTLP severity numbers",
  async () => {
    const cases: Array<[LogRecord["level"], number, string]> = [
      ["debug", 5, "DEBUG"],
      ["info", 9, "INFO"],
      ["warning", 13, "WARNING"],
      ["error", 17, "ERROR"],
      ["fatal", 21, "FATAL"],
    ];

    for (const [level, expectedNumber, expectedText] of cases) {
      const { calls } = mockFetch(200);
      const exporter = new OtlpFetchLogExporter(
        "https://otlp.grafana.net/otlp/v1/logs",
        {},
        {},
      );
      const sink = exporter.sink();
      sink(makeLogRecord({ level, message: ["msg"], rawMessage: "msg" }));

      await exporter.flush();

      const body = JSON.parse(calls[0].options.body as string);
      const logRecord = body.resourceLogs[0].scopeLogs[0].logRecords[0];
      assertEquals(
        logRecord.severityNumber,
        expectedNumber,
        `level ${level} should map to ${expectedNumber}`,
      );
      assertEquals(logRecord.severityText, expectedText);
    }
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() groups records by category into separate scopeLogs",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    sink(makeLogRecord({ category: ["scoundrel", "http"] }));
    sink(
      makeLogRecord({
        category: ["scoundrel", "game"],
        message: ["Game action"],
        rawMessage: "Game action",
      }),
    );

    await exporter.flush();

    const body = JSON.parse(calls[0].options.body as string);
    const scopeLogs = body.resourceLogs[0].scopeLogs;
    assertEquals(scopeLogs.length, 2);

    const scopeNames = scopeLogs.map((s: { scope: { name: string } }) =>
      s.scope.name
    ).sort();
    assertEquals(scopeNames, ["scoundrel.game", "scoundrel.http"]);
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() serializes record properties as OTLP attributes",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    sink(
      makeLogRecord({
        properties: { method: "POST", status: 201, route: "/api/games" },
      }),
    );

    await exporter.flush();

    const body = JSON.parse(calls[0].options.body as string);
    const attrs: Array<{ key: string; value: unknown }> =
      body.resourceLogs[0].scopeLogs[0].logRecords[0].attributes;

    const method = attrs.find((a) => a.key === "method");
    assertEquals(method?.value, { stringValue: "POST" });

    const status = attrs.find((a) => a.key === "status");
    assertEquals(status?.value, { intValue: "201" });
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() converts timestamp from ms to nanoseconds string",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    sink(makeLogRecord({ timestamp: 1704067260000 }));

    await exporter.flush();

    const body = JSON.parse(calls[0].options.body as string);
    const logRecord = body.resourceLogs[0].scopeLogs[0].logRecords[0];
    // 1704067260000 ms * 1,000,000 = 1704067260000000000 ns
    assertEquals(logRecord.timeUnixNano, "1704067260000000000");
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() renders message template parts into a string body",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    // LogTape template: "hello {name}" with name="world" produces ["hello ", "world", ""]
    sink(
      makeLogRecord({
        message: ["hello ", "world", ""],
        rawMessage: "hello {name}",
      }),
    );

    await exporter.flush();

    const body = JSON.parse(calls[0].options.body as string);
    const logRecord = body.resourceLogs[0].scopeLogs[0].logRecords[0];
    assertEquals(logRecord.body, { stringValue: "hello world" });
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() skips fetch when buffer is empty",
  async () => {
    let fetchCalled = false;
    globalThis.fetch = () => {
      fetchCalled = true;
      return Promise.resolve(new Response(null, { status: 200 }));
    };
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );

    await exporter.flush();

    assertEquals(fetchCalled, false);
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() clears the buffer after flushing",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    sink(makeLogRecord());

    await exporter.flush();
    await exporter.flush(); // second flush on empty buffer

    assertEquals(calls.length, 1); // only one POST
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() handles HTTP error responses gracefully",
  async () => {
    const originalError = console.error;
    const errors: string[] = [];
    console.error = (...args: unknown[]) => errors.push(args.join(" "));

    mockFetch(500);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    sink(makeLogRecord());

    await exporter.flush(); // should not throw

    assertEquals(errors.length > 0, true);
    console.error = originalError;
  },
);

Deno.test(
  "OtlpFetchLogExporter.flush() handles network errors gracefully",
  async () => {
    const originalError = console.error;
    const errors: string[] = [];
    console.error = (...args: unknown[]) => errors.push(args.join(" "));

    globalThis.fetch = () => Promise.reject(new Error("Network failure"));
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    sink(makeLogRecord());

    await exporter.flush(); // should not throw

    assertEquals(errors.length > 0, true);
    console.error = originalError;
  },
);

Deno.test(
  "OtlpFetchLogExporter.shutdown() flushes buffered records before shutting down",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      {},
      {},
    );
    const sink = exporter.sink();
    sink(makeLogRecord());

    await exporter.shutdown();

    assertEquals(calls.length, 1);
  },
);

Deno.test(
  "OtlpFetchLogExporter uses LogTape sink function compatible with configure()",
  async () => {
    const { calls } = mockFetch(200);
    const exporter = new OtlpFetchLogExporter(
      "https://otlp.grafana.net/otlp/v1/logs",
      { Authorization: "Basic abc123" },
      { "service.name": "scoundrel" },
    );

    await configure({
      sinks: { grafana: exporter.sink() },
      loggers: [
        { category: ["scoundrel"], lowestLevel: "info", sinks: ["grafana"] },
      ],
      reset: true,
    });

    // Records are buffered by the sink; flush sends them
    await exporter.flush();

    // No records yet — configure itself doesn't log into scoundrel category
    assertEquals(calls.length, 0);

    // Reset to avoid leaking state
    await configure({ sinks: {}, loggers: [], reset: true });
  },
);
