import { metrics, trace } from "npm:@opentelemetry/api@1";
import type { Meter, Tracer } from "npm:@opentelemetry/api@1";

export function getTracer(): Tracer {
  return trace.getTracer("scoundrel", "1.0.0");
}

export function getMeter(): Meter {
  return metrics.getMeter("scoundrel", "1.0.0");
}

export { metrics, trace } from "npm:@opentelemetry/api@1";
export type { Meter, Tracer } from "npm:@opentelemetry/api@1";
export { SpanStatusCode } from "npm:@opentelemetry/api@1";
