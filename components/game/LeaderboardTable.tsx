import type { LeaderboardEntry } from "@scoundrel/game-service";

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  highlightGameId: string | null;
  extraEntry?: { entry: LeaderboardEntry; rank: number } | null;
};

export function LeaderboardTable(
  { entries, highlightGameId, extraEntry }: LeaderboardTableProps,
) {
  const showExtraEntry = extraEntry != null &&
    !entries.some((e) => e.gameId === extraEntry.entry.gameId);

  return (
    <table class="w-full font-body text-sm">
      <thead>
        <tr class="text-parchment-dark border-b border-dungeon-border">
          <th class="text-left py-2 w-8">#</th>
          <th class="text-left py-2">Adventurer</th>
          <th class="text-right py-2">Score</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, i) => {
          const isHighlighted = entry.gameId === highlightGameId;
          return (
            <tr
              key={entry.gameId}
              class={`border-b border-dungeon-border/40 ${
                isHighlighted
                  ? "bg-torch-amber/10 text-torch-glow"
                  : "text-parchment"
              }`}
            >
              <td class="py-2 text-parchment-dark">{i + 1}</td>
              <td class="py-2 truncate max-w-[180px]">
                {isHighlighted
                  ? `\u25b6 ${entry.playerName}`
                  : entry.playerName}
              </td>
              <td
                class={`py-2 text-right font-heading ${
                  entry.score >= 0 ? "text-torch-amber" : "text-blood-bright"
                }`}
              >
                {entry.score}
              </td>
            </tr>
          );
        })}
        {showExtraEntry && (
          <>
            <tr class="border-b border-dungeon-border/40">
              <td
                class="py-1 text-parchment-dark/50 text-center"
                colSpan={3}
              >
                &middot;&middot;&middot;
              </td>
            </tr>
            <tr class="border-b border-dungeon-border/40 bg-torch-amber/10 text-torch-glow">
              <td class="py-2 text-parchment-dark">{extraEntry!.rank}</td>
              <td class="py-2 truncate max-w-[180px]">
                {`\u25b6 ${extraEntry!.entry.playerName}`}
              </td>
              <td
                class={`py-2 text-right font-heading ${
                  extraEntry!.entry.score >= 0
                    ? "text-torch-amber"
                    : "text-blood-bright"
                }`}
              >
                {extraEntry!.entry.score}
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}
