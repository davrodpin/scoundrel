export { createConfig } from "./config.ts";
export { loadConfigFromEnv } from "./load.ts";
export { type AppConfig, configSchema } from "./schema.ts";

import { createConfig } from "./config.ts";
import { loadConfigFromEnv } from "./load.ts";

export const config = createConfig(loadConfigFromEnv());
