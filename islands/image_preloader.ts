export type PreloadProgress = {
  loaded: number;
  total: number;
};

export type PreloadResult = {
  succeeded: number;
  failed: number;
  total: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Preloads all images at the given paths. Calls onProgress after each image
 * settles (either loaded or errored). Resolves once all images have settled
 * or the timeout fires, whichever comes first.
 */
export function preloadImages(
  paths: readonly string[],
  onProgress: (progress: PreloadProgress) => void,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<PreloadResult> {
  const total = paths.length;

  if (total === 0) {
    return Promise.resolve({ succeeded: 0, failed: 0, total: 0 });
  }

  return new Promise<PreloadResult>((resolve) => {
    let loaded = 0;
    let succeeded = 0;
    let failed = 0;

    const timeoutId = setTimeout(() => {
      resolve({ succeeded, failed, total });
    }, timeoutMs);

    function onSettle(ok: boolean) {
      loaded++;
      if (ok) succeeded++;
      else failed++;
      onProgress({ loaded, total });
      if (loaded === total) {
        clearTimeout(timeoutId);
        resolve({ succeeded, failed, total });
      }
    }

    for (const path of paths) {
      const img = new globalThis.Image();
      img.onload = () => onSettle(true);
      img.onerror = () => onSettle(false);
      img.src = path;
    }
  });
}
