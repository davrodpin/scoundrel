/** @jsxImportSource preact */

type WelcomeScreenProps = {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStartGame: () => void;
  loading: boolean;
  errorMsg: string | null;
};

export function WelcomeScreen(
  {
    playerName,
    onPlayerNameChange,
    onStartGame,
    loading,
    errorMsg,
  }: WelcomeScreenProps,
) {
  const trimmedName = playerName.trim();
  return (
    <div class="min-h-screen bg-dungeon-bg flex flex-col items-center justify-center">
      <div class="text-center">
        <h1 class="font-heading text-5xl text-parchment mb-4">Scoundrel</h1>
        <p class="text-parchment-dark font-body mb-8">
          A Single Player Rogue-like Card Game
        </p>
        <div class="w-full max-w-xs mx-auto px-4">
          <div class="mb-4">
            <input
              type="text"
              placeholder="Enter your name, adventurer..."
              maxLength={16}
              value={playerName}
              onInput={(e) => {
                onPlayerNameChange((e.target as HTMLInputElement).value);
              }}
              class="w-full px-4 py-2 rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment font-body placeholder-parchment-dark/50 focus:outline-none focus:border-torch-amber transition-colors duration-200"
            />
          </div>
          <button
            type="button"
            class="w-full px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onStartGame}
            disabled={loading || trimmedName.length === 0}
          >
            Enter the Dungeon
          </button>
          <div class="flex items-center justify-center gap-2 mt-4">
            <a
              href="/how-to-play"
              class="text-sm font-body text-parchment-dark hover:text-torch-amber transition-colors duration-200"
            >
              How to Play
            </a>
            <span class="text-parchment-dark/50 text-sm">·</span>
            <a
              href="/leaderboard"
              class="text-sm font-body text-parchment-dark hover:text-torch-amber transition-colors duration-200"
            >
              Show Leaderboard
            </a>
          </div>
          {errorMsg && (
            <p class="text-blood-bright font-body text-sm mt-3">{errorMsg}</p>
          )}
        </div>
      </div>
      <footer class="absolute bottom-4 text-parchment-dark/50 font-body text-xs text-center px-4 max-w-lg">
        This is an unofficial fan-made implementation. Scoundrel was designed
        {" "}
        <a
          href="http://stfj.net/art/2011/Scoundrel.pdf"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-parchment-dark underline transition-colors duration-200"
        >
          by Zach Gage and Kurt Bieg
        </a>
        . This app is not affiliated with, endorsed by, or associated with the
        original authors in any way.
      </footer>
    </div>
  );
}
