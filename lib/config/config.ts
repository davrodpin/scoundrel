import { type AppConfig, configSchema } from "./schema.ts";

export function createConfig(raw: unknown): AppConfig {
  const result = configSchema.parse(raw);
  return Object.freeze(result) as AppConfig;
}
