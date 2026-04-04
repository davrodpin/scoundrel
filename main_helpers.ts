/**
 * Returns true if the request pathname should receive long-lived cache headers.
 * Card images and deck assets under /decks/ are immutable between deploys.
 */
export function shouldApplyDeckCache(pathname: string): boolean {
  return pathname.startsWith("/decks/");
}
