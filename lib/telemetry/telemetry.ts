import { trace } from "npm:@opentelemetry/api@1";
import type { Tracer } from "npm:@opentelemetry/api@1";

export function getTracer(): Tracer {
  return trace.getTracer("scoundrel", "1.0.0");
}

export { trace } from "npm:@opentelemetry/api@1";
export type { Tracer } from "npm:@opentelemetry/api@1";
export { SpanStatusCode } from "npm:@opentelemetry/api@1";
