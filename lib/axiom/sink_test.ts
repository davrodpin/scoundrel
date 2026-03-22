import { assertEquals } from "@std/assert";
import type { LogRecord } from "@logtape/logtape";
import { createAxiomSink } from "./sink.ts";

const TEST_CONFIG = {
  apiToken: "xaat-test-token",
  dataset: "scoundrel-logs",
};

function makeRecord(
  overrides: Partial<{
    level: LogRecord["level"];
    category: string[];
    message: readonly unknown[];
    properties: Record<string, unknown>;
    timestamp: number;
  }> = {},
): LogRecord {
  return {
    level: overrides.level ?? "info",
    category: overrides.category ?? ["scoundrel", "http"],
    message: overrides.message ?? ["Request completed"],
    rawMessage: "Request completed",
    properties: overrides.properties ?? {},
    timestamp: overrides.timestamp ?? new Date("2024-01-15T10:00:00.000Z").getTime(),
  };
}

function makeOkResponse() {
  return Promise.resolve(new Response(null, { status: 200 }));
}

Deno.test("createAxiomSink — transforms LogRecord to correct Axiom event shape", async () => {
  let capturedBody: unknown[] = [];
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return makeOkResponse();
  };

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord());
  flush();

  // Give the floating fetch promise a tick to settle
  await new Promise((r) => setTimeout(r, 0));

  assertEquals(capturedBody.length, 1);
  const event = capturedBody[0] as Record<string, unknown>;
  assertEquals(event["_time"], "2024-01-15T10:00:00.000Z");
  assertEquals(event["level"], "info");
  assertEquals(event["category"], "scoundrel.http");
  assertEquals(event["message"], "Request completed");
});

Deno.test("createAxiomSink — batches multiple records into single POST", async () => {
  let capturedBody: unknown[] = [];
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return makeOkResponse();
  };

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord({ message: ["first"] }));
  sink(makeRecord({ message: ["second"] }));
  sink(makeRecord({ message: ["third"] }));
  flush();

  await new Promise((r) => setTimeout(r, 0));

  assertEquals(capturedBody.length, 3);
});

Deno.test("createAxiomSink — sends correct Authorization header", async () => {
  let capturedHeaders: Record<string, string> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedHeaders = Object.fromEntries(
      new Headers(init?.headers).entries(),
    );
    return makeOkResponse();
  };

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord());
  flush();

  await new Promise((r) => setTimeout(r, 0));

  assertEquals(capturedHeaders["authorization"], "Bearer xaat-test-token");
  assertEquals(capturedHeaders["content-type"], "application/json");
});

Deno.test("createAxiomSink — posts to correct Axiom ingest URL", async () => {
  let capturedUrl = "";
  globalThis.fetch = (input: RequestInfo | URL, _init?: RequestInit) => {
    capturedUrl = input.toString();
    return makeOkResponse();
  };

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord());
  flush();

  await new Promise((r) => setTimeout(r, 0));

  assertEquals(
    capturedUrl,
    "https://api.axiom.co/v1/datasets/scoundrel-logs/ingest",
  );
});

Deno.test("createAxiomSink — silently handles fetch rejection", async () => {
  globalThis.fetch = () => Promise.reject(new Error("Network error"));

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord());
  flush();

  // Should not throw — just wait for the floating promise to settle
  await new Promise((r) => setTimeout(r, 10));
});

Deno.test("createAxiomSink — silently handles non-OK response", async () => {
  globalThis.fetch = () =>
    Promise.resolve(new Response(null, { status: 500 }));

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord());
  flush();

  await new Promise((r) => setTimeout(r, 10));
});

Deno.test("createAxiomSink — empty buffer does not trigger fetch", async () => {
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    return makeOkResponse();
  };

  const { flush } = createAxiomSink(TEST_CONFIG);
  flush();

  await new Promise((r) => setTimeout(r, 10));

  assertEquals(fetchCalled, false);
});

Deno.test("createAxiomSink — structured properties are flattened into event", async () => {
  let capturedBody: unknown[] = [];
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return makeOkResponse();
  };

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord({
    properties: { gameId: "abc-123", duration: 42, status: 200 },
  }));
  flush();

  await new Promise((r) => setTimeout(r, 0));

  const event = capturedBody[0] as Record<string, unknown>;
  assertEquals(event["gameId"], "abc-123");
  assertEquals(event["duration"], 42);
  assertEquals(event["status"], 200);
});

Deno.test("createAxiomSink — flush swaps buffer so new records go into fresh batch", async () => {
  const batches: unknown[][] = [];
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    batches.push(JSON.parse(init?.body as string));
    return makeOkResponse();
  };

  const { sink, flush } = createAxiomSink(TEST_CONFIG);
  sink(makeRecord({ message: ["before flush"] }));
  flush();

  sink(makeRecord({ message: ["after flush"] }));
  flush();

  await new Promise((r) => setTimeout(r, 10));

  assertEquals(batches.length, 2);
  assertEquals((batches[0] as Record<string, unknown>[])[0]["message"], "before flush");
  assertEquals((batches[1] as Record<string, unknown>[])[0]["message"], "after flush");
});
