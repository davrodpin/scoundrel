import { SpanStatusCode } from "@opentelemetry/api";
import type {
  BatchObservableCallback,
  Counter,
  Gauge,
  Histogram,
  Meter,
  MetricAttributes,
  MetricOptions,
  Observable,
  ObservableCounter,
  ObservableGauge,
  ObservableUpDownCounter,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  Tracer,
  UpDownCounter,
} from "@opentelemetry/api";

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

export type RecordedMetric = {
  name: string;
  value: number;
  attributes: MetricAttributes;
};

function makeSpyCounter(
  name: string,
  recorded: RecordedMetric[],
): Counter & UpDownCounter {
  return {
    add(value: number, attributes?: MetricAttributes) {
      recorded.push({ name, value, attributes: attributes ?? {} });
    },
  };
}

function makeNoopObservable<
  T extends MetricAttributes = MetricAttributes,
>(): ObservableGauge<T> & ObservableCounter<T> & ObservableUpDownCounter<T> {
  return {
    addCallback(_cb: unknown) {},
    removeCallback(_cb: unknown) {},
  };
}

export function createSpyMeter(): {
  meter: Meter;
  getMetrics(): RecordedMetric[];
} {
  const recorded: RecordedMetric[] = [];

  const meter: Meter = {
    createCounter<T extends MetricAttributes = MetricAttributes>(
      name: string,
      _options?: MetricOptions,
    ): Counter<T> {
      return makeSpyCounter(name, recorded) as Counter<T>;
    },
    createUpDownCounter<T extends MetricAttributes = MetricAttributes>(
      name: string,
      _options?: MetricOptions,
    ): UpDownCounter<T> {
      return makeSpyCounter(name, recorded) as UpDownCounter<T>;
    },
    createHistogram<T extends MetricAttributes = MetricAttributes>(
      _name: string,
      _options?: MetricOptions,
    ): Histogram<T> {
      return { record() {} } as unknown as Histogram<T>;
    },
    createGauge<T extends MetricAttributes = MetricAttributes>(
      _name: string,
      _options?: MetricOptions,
    ): Gauge<T> {
      return { record() {} } as unknown as Gauge<T>;
    },
    createObservableGauge<T extends MetricAttributes = MetricAttributes>(
      _name: string,
      _options?: MetricOptions,
    ): ObservableGauge<T> {
      return makeNoopObservable<T>();
    },
    createObservableCounter<T extends MetricAttributes = MetricAttributes>(
      _name: string,
      _options?: MetricOptions,
    ): ObservableCounter<T> {
      return makeNoopObservable<T>();
    },
    createObservableUpDownCounter<
      T extends MetricAttributes = MetricAttributes,
    >(
      _name: string,
      _options?: MetricOptions,
    ): ObservableUpDownCounter<T> {
      return makeNoopObservable<T>();
    },
    addBatchObservableCallback<T extends MetricAttributes = MetricAttributes>(
      _callback: BatchObservableCallback<T>,
      _observables: Observable<T>[],
    ): void {},
    removeBatchObservableCallback<
      T extends MetricAttributes = MetricAttributes,
    >(
      _callback: BatchObservableCallback<T>,
      _observables: Observable<T>[],
    ): void {},
  };

  return { meter, getMetrics: () => [...recorded] };
}
