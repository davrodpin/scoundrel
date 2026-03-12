import { getLogger } from "@logtape/logtape";

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
): CleanupService {
  const logger = getLogger(["scoundrel", "cleanup"]);

  return {
    async runCleanup(): Promise<void> {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - config.retentionDays);
      const count = await repository.deleteGamesOlderThan(cutoff);
      logger.info("Cleanup completed", {
        deletedCount: count,
        retentionDays: config.retentionDays,
      });
    },
  };
}
