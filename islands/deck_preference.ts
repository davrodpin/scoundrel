const STORAGE_KEY = "scoundrel:selectedDeckId";

export function loadDeckPreference(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function saveDeckPreference(deckId: string): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, deckId);
  } catch {
    // localStorage unavailable (SSR, private browsing quota exceeded)
  }
}

export function getInitialDeckId(
  availableDeckIds: string[],
  defaultDeck: string,
): string {
  const stored = loadDeckPreference();
  if (stored !== null && availableDeckIds.includes(stored)) {
    return stored;
  }
  return defaultDeck;
}
