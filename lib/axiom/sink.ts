import type { LogRecord } from "@logtape/logtape";
import type { AxiomEvent, AxiomSinkConfig } from "./types.ts";

function renderMessage(parts: readonly unknown[]): string {
  return parts.map((p) => {
    if (typeof p === "function") return String((p as () => unknown)());
    if (p === null || p === undefined) return "";
    return String(p);
  }).join("");
}

function toAxiomEvent(record: LogRecord): AxiomEvent {
  return {
    _time: new Date(record.timestamp).toISOString(),
    level: record.level,
    category: record.category.join("."),
    message: renderMessage(record.message),
    ...record.properties,
  };
}

export function createAxiomSink(
  config: AxiomSinkConfig,
): { sink: (record: LogRecord) => void; flush: () => void } {
  let buffer: AxiomEvent[] = [];

  const url =
    `https://api.axiom.co/v1/datasets/${config.dataset}/ingest`;

  function flush(): void {
    if (buffer.length === 0) return;

    const batch = buffer;
    buffer = [];

    // Fire-and-forget: the fetch promise floats — the caller never awaits it.
    // Errors are swallowed via .catch() to avoid crashing the isolate.
    fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    }).catch((err: unknown) => {
      console.error("[axiom] Failed to send logs", err);
    });
  }

  function sink(record: LogRecord): void {
    buffer.push(toAxiomEvent(record));
  }

  return { sink, flush };
}
