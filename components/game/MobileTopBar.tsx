type MobileTopBarProps = {
  health: number;
  maxHealth: number;
  playerName: string;
  damageFlash?: boolean;
  healFlash?: boolean;
  onBackToMenuClick?: () => void;
  onRulesClick: () => void;
  onLeaderboardClick: () => void;
  onCopyLinkClick: () => void;
  onFeedbackClick?: () => void;
  copiedLink: boolean;
};

export function MobileTopBar(
  {
    health,
    maxHealth,
    playerName,
    damageFlash,
    healFlash,
    onBackToMenuClick,
    onRulesClick,
    onLeaderboardClick,
    onCopyLinkClick,
    onFeedbackClick,
    copiedLink,
  }: MobileTopBarProps,
) {
  const pct = Math.max(0, (health / maxHealth) * 100);

  let barColor = "bg-potion-green";
  if (pct <= 25) barColor = "bg-blood-bright";
  else if (pct <= 50) barColor = "bg-torch-amber";

  return (
    <div
      class={`flex md:hidden items-center gap-1 w-full ${
        damageFlash ? "animate-damage-flash" : ""
      } ${healFlash ? "animate-heal-glow" : ""}`}
    >
      {/* Health bar — takes remaining space */}
      <div class="flex-1 flex items-center gap-2 bg-dungeon-surface border border-dungeon-border rounded-sm px-3 py-2 min-w-0">
        <span class="font-heading text-parchment text-base truncate max-w-[120px] leading-tight">
          {playerName}
        </span>
        <span class="text-parchment-dark/50 text-xs font-body mx-1">|</span>
        <span class="font-heading text-parchment text-base leading-tight">
          {health}
        </span>
        <span class="text-parchment-dark/50 font-body text-xs">
          /{maxHealth}
        </span>
        <div class="flex-1 ml-2 h-1.5 bg-dungeon-bg rounded-sm border border-dungeon-border/60 overflow-hidden">
          <div
            class={`h-full ${barColor} transition-[width] duration-500`}
            style={`width: ${pct}%`}
          />
        </div>
      </div>

      {/* Icon buttons — inline, no fixed positioning */}
      <div class="flex gap-1 flex-shrink-0">
        {/* Back to menu */}
        {onBackToMenuClick && (
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
            onClick={onBackToMenuClick}
            aria-label="Flee the Dungeon"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-5 h-5"
            >
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 5 12 10 7" />
              <line x1="15" y1="12" x2="5" y2="12" />
            </svg>
          </button>
        )}

        {/* Leaderboard */}
        <button
          type="button"
          class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
          onClick={onLeaderboardClick}
          aria-label="The Gravekeeper's Ledger"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        {/* Copy link */}
        <button
          type="button"
          class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
          onClick={onCopyLinkClick}
          aria-label={copiedLink ? "Link copied!" : "Copy shareable link"}
        >
          {copiedLink
            ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="w-5 h-5 text-torch-amber"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )
            : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="w-5 h-5"
              >
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            )}
        </button>

        {/* Rules */}
        <button
          type="button"
          class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber font-heading text-lg transition-colors duration-200"
          onClick={onRulesClick}
          aria-label="Game rules"
        >
          ?
        </button>

        {/* Feedback */}
        {onFeedbackClick && (
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
            onClick={onFeedbackClick}
            aria-label="Send feedback"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-5 h-5"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
