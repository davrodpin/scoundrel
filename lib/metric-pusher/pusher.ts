import { getLogger } from "@logtape/logtape";
import { toOtlpAttributes } from "../telemetry/otlp_helpers.ts";

type MetricPusherRepository = {
  countGamesByStatus(): Promise<{ inProgress: number; completed: number }>;
};

export type MetricPusherConfig = {
  grafanaEndpoint: string;
  grafanaAuthHeaders: Record<string, string>;
  resourceAttributes: Record<string, string>;
};

export type MetricPusherService = {
  pushGameMetrics(): Promise<void>;
};

function nowNanoString(): string {
  return (BigInt(Date.now()) * 1_000_000n).toString();
}

export function createMetricPusherService(
  repository: MetricPusherRepository,
  config: MetricPusherConfig,
  fetchFn: typeof globalThis.fetch = globalThis.fetch,
): MetricPusherService {
  const logger = getLogger(["scoundrel", "metric-pusher"]);
  const startTimeUnixNano = nowNanoString();

  return {
    async pushGameMetrics(): Promise<void> {
      const { inProgress, completed } = await repository.countGamesByStatus();
      const timeUnixNano = nowNanoString();

      const payload = {
        resourceMetrics: [
          {
            resource: {
              attributes: toOtlpAttributes(config.resourceAttributes),
            },
            scopeMetrics: [
              {
                scope: { name: "scoundrel", version: "1.0.0" },
                metrics: [
                  {
                    name: "game.in_progress",
                    unit: "{game}",
                    sum: {
                      dataPoints: [
                        {
                          attributes: [],
                          startTimeUnixNano,
                          timeUnixNano,
                          asInt: String(inProgress + completed),
                        },
                      ],
                      aggregationTemporality: 2,
                      isMonotonic: true,
                    },
                  },
                  {
                    name: "game.completed",
                    unit: "{game}",
                    sum: {
                      dataPoints: [
                        {
                          attributes: [],
                          startTimeUnixNano,
                          timeUnixNano,
                          asInt: String(completed),
                        },
                      ],
                      aggregationTemporality: 2,
                      isMonotonic: true,
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      try {
        const response = await fetchFn(config.grafanaEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...config.grafanaAuthHeaders,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          logger.info("Game metrics pushed", { inProgress, completed });
        } else {
          const body = await response.text().catch(() => "");
          logger.error("Game metrics push failed", {
            status: response.status,
            body,
          });
        }
      } catch (err) {
        logger.error("Game metrics push network error", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  };
}
