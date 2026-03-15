export function getLeaderboardStatusMessage(
  loading: boolean,
  entriesCount: number,
): string | null {
  if (loading) return "Opening the Gravekeeper's Ledger...";
  if (entriesCount === 0) {
    return "No completed games yet. Be the first to conquer the dungeon.";
  }
  return null;
}
