import { getLogger } from "@logtape/logtape";
import { SpanStatusCode } from "@opentelemetry/api";
import type { Tracer } from "@opentelemetry/api";

export type CleanupConfig = {
  retentionDays: number;
};

type CleanupRepository = {
  deleteGamesOlderThan(cutoffDate: Date): Promise<number>;
};

export type CleanupService = {
  runCleanup(): Promise<void>;
};

export function createCleanupService(
  repository: CleanupRepository,
  config: CleanupConfig,
  tracer: Tracer,
): CleanupService {
  const logger = getLogger(["scoundrel", "cleanup"]);

  return {
    runCleanup(): Promise<void> {
      return tracer.startActiveSpan("cleanup.runCleanup", async (span) => {
        span.setAttribute("cleanup.retention_days", config.retentionDays);
        try {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - config.retentionDays);
          const count = await repository.deleteGamesOlderThan(cutoff);
          span.setAttribute("cleanup.deleted_count", count);
          logger.info("Cleanup completed", {
            deletedCount: count,
            retentionDays: config.retentionDays,
          });
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          span.end();
        }
      }) as Promise<void>;
    },
  };
}
