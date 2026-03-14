import { assertEquals } from "@std/assert";
import { getTracer } from "./telemetry.ts";

Deno.test("getTracer returns an object with startActiveSpan method", () => {
  const tracer = getTracer();
  assertEquals(typeof tracer.startActiveSpan, "function");
});

Deno.test("getTracer returns an object with startSpan method", () => {
  const tracer = getTracer();
  assertEquals(typeof tracer.startSpan, "function");
});
