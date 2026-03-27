export type OtlpAnyValue =
  | { stringValue: string }
  | { intValue: string }
  | { doubleValue: number }
  | { boolValue: boolean };

export type OtlpKeyValue = { key: string; value: OtlpAnyValue };

export function toOtlpValue(v: unknown): OtlpAnyValue {
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") {
    if (Number.isInteger(v)) return { intValue: String(v) };
    return { doubleValue: v };
  }
  if (typeof v === "boolean") return { boolValue: v };
  return { stringValue: String(v) };
}

export function toOtlpAttributes(
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
