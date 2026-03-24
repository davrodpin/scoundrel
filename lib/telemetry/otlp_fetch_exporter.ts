import type { ReadableLogRecord } from "@opentelemetry/sdk-logs";
import type { HrTime } from "@opentelemetry/api";

export type ExportResult = {
  code: 0 | 1; // 0 = SUCCESS, 1 = FAILED
  error?: Error;
};

type OtlpAnyValue =
  | { stringValue: string }
  | { intValue: string }
  | { doubleValue: number }
  | { boolValue: boolean };

function toOtlpValue(v: unknown): OtlpAnyValue {
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") {
    if (Number.isInteger(v)) return { intValue: String(v) };
    return { doubleValue: v };
  }
  if (typeof v === "boolean") return { boolValue: v };
  return { stringValue: String(v) };
}

type OtlpKeyValue = { key: string; value: OtlpAnyValue };

function toOtlpAttributes(
  attrs: Record<string, unknown>,
): OtlpKeyValue[] {
  return Object.entries(attrs)
    .filter(([, v]) => v != null)
    .map(([key, value]) => ({
      key,
      value: Array.isArray(value)
        ? { stringValue: JSON.stringify(value) }
        : toOtlpValue(value),
    }));
}

function hrTimeToNanoString([seconds, nanos]: HrTime): string {
  return String(Math.floor(seconds) * 1_000_000_000 + nanos);
}

function bodyToOtlpValue(body: unknown): OtlpAnyValue | undefined {
  if (body == null) return undefined;
  if (body instanceof Uint8Array) return undefined; // binary body not supported
  if (typeof body === "object") return { stringValue: JSON.stringify(body) };
  return toOtlpValue(body);
}

export class OtlpFetchLogExporter {
  readonly #url: string;
  readonly #headers: Record<string, string>;

  constructor(url: string, headers: Record<string, string>) {
    this.#url = url;
    this.#headers = headers;
  }

  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    if (logs.length === 0) {
      resultCallback({ code: 0 });
      return;
    }

    const resourceLogs = this.#buildResourceLogs(logs);

    fetch(this.#url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.#headers },
      body: JSON.stringify({ resourceLogs }),
    }).then((response) => {
      if (response.ok) {
        resultCallback({ code: 0 });
      } else {
        resultCallback({
          code: 1,
          error: new Error(`OTLP export failed with HTTP ${response.status}`),
        });
      }
    }).catch((error: unknown) => {
      resultCallback({
        code: 1,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  #buildResourceLogs(logs: ReadableLogRecord[]) {
    const firstLog = logs[0];
    const resourceAttrs = toOtlpAttributes(
      firstLog.resource.attributes as Record<string, unknown>,
    );

    const logRecords = logs.map((log) => {
      const record: Record<string, unknown> = {
        timeUnixNano: hrTimeToNanoString(log.hrTime),
        severityNumber: log.severityNumber ?? 0,
        severityText: log.severityText,
        attributes: toOtlpAttributes(
          log.attributes as Record<string, unknown>,
        ),
      };
      const bodyValue = bodyToOtlpValue(log.body);
      if (bodyValue != null) {
        record["body"] = bodyValue;
      }
      return record;
    });

    return [{
      resource: { attributes: resourceAttrs },
      scopeLogs: [{
        scope: {
          name: firstLog.instrumentationScope.name,
          version: firstLog.instrumentationScope.version,
        },
        logRecords,
      }],
    }];
  }
}
