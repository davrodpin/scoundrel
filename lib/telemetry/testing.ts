import { SpanStatusCode } from "npm:@opentelemetry/api@1";
import type {
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  Tracer,
} from "npm:@opentelemetry/api@1";

export type RecordedSpan = {
  name: string;
  attributes: Record<string, unknown>;
  ended: boolean;
  error: unknown;
  status: SpanStatus;
};

function makeSpySpan(_name: string, recorded: RecordedSpan): Span {
  const attrs = recorded.attributes;
  return {
    setAttribute(key: string, value: unknown) {
      attrs[key] = value;
      return this;
    },
    setAttributes(a: Record<string, unknown>) {
      Object.assign(attrs, a);
      return this;
    },
    end() {
      recorded.ended = true;
    },
    recordException(err: unknown) {
      recorded.error = err;
    },
    setStatus(status: SpanStatus) {
      recorded.status = status;
      return this;
    },
    addEvent() {
      return this;
    },
    isRecording() {
      return true;
    },
    spanContext(): SpanContext {
      return {
        traceId: "00000000000000000000000000000001",
        spanId: "0000000000000001",
        traceFlags: 1,
        isRemote: false,
      };
    },
    updateName(n: string) {
      recorded.name = n;
      return this;
    },
    addLink() {
      return this;
    },
    addLinks() {
      return this;
    },
  };
}

export function createSpyTracer(): {
  tracer: Tracer;
  getSpans(): RecordedSpan[];
} {
  const spans: RecordedSpan[] = [];

  const tracer: Tracer = {
    startSpan(name: string, _options?: SpanOptions): Span {
      const recorded: RecordedSpan = {
        name,
        attributes: {},
        ended: false,
        error: undefined,
        status: { code: SpanStatusCode.UNSET },
      };
      spans.push(recorded);
      return makeSpySpan(name, recorded);
    },
    startActiveSpan(
      name: string,
      ...args: unknown[]
    ): unknown {
      const fn = args[args.length - 1] as (span: Span) => unknown;
      const recorded: RecordedSpan = {
        name,
        attributes: {},
        ended: false,
        error: undefined,
        status: { code: SpanStatusCode.UNSET },
      };
      spans.push(recorded);
      const span = makeSpySpan(name, recorded);
      return fn(span);
    },
  };

  return { tracer, getSpans: () => [...spans] };
}
