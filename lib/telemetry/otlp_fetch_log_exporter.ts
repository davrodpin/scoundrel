import { type LogRecord } from "@logtape/logtape";
import { toOtlpAttributes } from "./otlp_helpers.ts";

const SEVERITY: Record<string, { number: number; text: string }> = {
  debug: { number: 5, text: "DEBUG" },
  info: { number: 9, text: "INFO" },
  warning: { number: 13, text: "WARNING" },
  error: { number: 17, text: "ERROR" },
  fatal: { number: 21, text: "FATAL" },
};

function renderMessage(message: readonly (string | unknown)[]): string {
  return message.map((part) => typeof part === "string" ? part : String(part))
    .join("");
}

function msToNanoString(ms: number): string {
  return (BigInt(Math.floor(ms)) * 1_000_000n).toString();
}

export class OtlpFetchLogExporter {
  readonly #url: string;
  readonly #headers: Record<string, string>;
  readonly #resourceAttributes: Record<string, string>;
  #buffer: LogRecord[] = [];

  constructor(
    url: string,
    headers: Record<string, string>,
    resourceAttributes: Record<string, string>,
  ) {
    this.#url = url;
    this.#headers = headers;
    this.#resourceAttributes = resourceAttributes;
  }

  sink(): (record: LogRecord) => void {
    return (record: LogRecord) => {
      this.#buffer.push(record);
    };
  }

  async flush(): Promise<void> {
    if (this.#buffer.length === 0) {
      return;
    }

    const records = this.#buffer;
    this.#buffer = [];

    const payload = this.#buildPayload(records);

    try {
      const response = await fetch(this.#url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.#headers },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(
          `[otlp] logs export failed with HTTP ${response.status}: ${body}`,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[otlp] logs export network error: ${msg}`);
    }
  }

  async shutdown(): Promise<void> {
    await this.flush();
  }

  #buildPayload(records: LogRecord[]) {
    const resourceAttrs = toOtlpAttributes(
      this.#resourceAttributes as Record<string, unknown>,
    );

    // Group by category (joined with ".")
    const byScope = new Map<string, LogRecord[]>();
    for (const record of records) {
      const scopeName = record.category.join(".");
      const group = byScope.get(scopeName);
      if (group) {
        group.push(record);
      } else {
        byScope.set(scopeName, [record]);
      }
    }

    const scopeLogs = Array.from(byScope.entries()).map(
      ([scopeName, scopeRecords]) => ({
        scope: { name: scopeName },
        logRecords: scopeRecords.map((r) => {
          const severity = SEVERITY[r.level] ??
            { number: 0, text: "UNSPECIFIED" };
          return {
            timeUnixNano: msToNanoString(r.timestamp),
            severityNumber: severity.number,
            severityText: severity.text,
            body: { stringValue: renderMessage(r.message) },
            attributes: toOtlpAttributes(
              r.properties as Record<string, unknown>,
            ),
          };
        }),
      }),
    );

    return {
      resourceLogs: [
        {
          resource: { attributes: resourceAttrs },
          scopeLogs,
        },
      ],
    };
  }
}
