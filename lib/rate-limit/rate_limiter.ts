export type RateLimiterOptions = {
  windowMs: number;
  maxRequests: number;
  getNow?: () => number;
};

export type RateLimiter = {
  isAllowed(key: string): boolean;
};

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, maxRequests, getNow = Date.now } = options;
  const windows = new Map<string, number[]>();

  return {
    isAllowed(key: string): boolean {
      const now = getNow();
      const cutoff = now - windowMs;
      const timestamps = (windows.get(key) ?? []).filter((t) => t > cutoff);

      if (timestamps.length >= maxRequests) {
        windows.set(key, timestamps);
        return false;
      }

      timestamps.push(now);
      windows.set(key, timestamps);
      return true;
    },
  };
}
