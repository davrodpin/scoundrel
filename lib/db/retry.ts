import type { GameRepository } from "@scoundrel/game-service";

export type RetryOptions = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableMessages: string[];
};

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  retryableMessages: [
    "Connection terminated",
    "connection timeout",
    "Connection refused",
    "ECONNRESET",
    "ETIMEDOUT",
    "sorry, too many clients already",
  ],
};

export function isRetryableError(
  error: unknown,
  patterns: string[],
): boolean {
  if (!(error instanceof Error)) return false;
  return patterns.some((pattern) => error.message.includes(pattern));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = DEFAULT_RETRY_OPTIONS,
  delayFn: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err, opts.retryableMessages)) throw err;
      if (attempt < opts.maxRetries) {
        const delay = Math.min(
          opts.baseDelayMs * 2 ** attempt + Math.random() * opts.baseDelayMs,
          opts.maxDelayMs,
        );
        await delayFn(delay);
      }
    }
  }
  throw lastError;
}

export function createResilientRepository(
  inner: GameRepository,
  opts: RetryOptions = DEFAULT_RETRY_OPTIONS,
  delayFn?: (ms: number) => Promise<void>,
): GameRepository {
  const wrap = <T>(fn: () => Promise<T>): Promise<T> =>
    withRetry(fn, opts, delayFn);

  return {
    createGame: (gameId, playerName, event) =>
      wrap(() => inner.createGame(gameId, playerName, event)),
    appendEvent: (gameId, event) =>
      wrap(() => inner.appendEvent(gameId, event)),
    appendEvents: (gameId, events) =>
      wrap(() => inner.appendEvents(gameId, events)),
    getLatestEvent: (gameId) => wrap(() => inner.getLatestEvent(gameId)),
    getAllEvents: (gameId) => wrap(() => inner.getAllEvents(gameId)),
    updateStatus: (gameId, status, score) =>
      wrap(() => inner.updateStatus(gameId, status, score)),
    getPlayerName: (gameId) => wrap(() => inner.getPlayerName(gameId)),
    getGameStatus: (gameId) => wrap(() => inner.getGameStatus(gameId)),
    getLeaderboard: (limit) => wrap(() => inner.getLeaderboard(limit)),
    getLeaderboardEntry: (gameId) =>
      wrap(() => inner.getLeaderboardEntry(gameId)),
    getLeaderboardRank: (score, completedAt) =>
      wrap(() => inner.getLeaderboardRank(score, completedAt)),
    createLeaderboardEntry: (gameId, playerName, score, completedAt) =>
      wrap(() =>
        inner.createLeaderboardEntry(gameId, playerName, score, completedAt)
      ),
    deleteGamesOlderThan: (cutoffDate) =>
      wrap(() => inner.deleteGamesOlderThan(cutoffDate)),
    countGamesByStatus: () => wrap(() => inner.countGamesByStatus()),
  };
}
