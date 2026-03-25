import { trace } from "@opentelemetry/api";
import type { Tracer } from "@opentelemetry/api";

export function getTracer(): Tracer {
  return trace.getTracer("scoundrel", "1.0.0");
}

export { metrics, trace } from "@opentelemetry/api";
export type { Meter, Tracer } from "@opentelemetry/api";
export { SpanStatusCode } from "@opentelemetry/api";
