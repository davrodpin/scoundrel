type LeaderboardToggleButtonProps = {
  onClick: () => void;
};

export function LeaderboardToggleButton(
  { onClick }: LeaderboardToggleButtonProps,
) {
  return (
    <div class="fixed top-2 right-11 md:top-4 md:right-14 z-30 group">
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber font-heading text-lg transition-colors duration-200"
        onClick={onClick}
        aria-label="Leaderboard"
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
      <div class="pointer-events-none absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
        <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm whitespace-nowrap">
          Leaderboard
        </div>
        <div class="absolute bottom-full right-3 border-4 border-transparent border-b-dungeon-border" />
      </div>
    </div>
  );
}
