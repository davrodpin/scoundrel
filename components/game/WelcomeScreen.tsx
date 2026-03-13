/** @jsxImportSource preact */

type WelcomeScreenProps = {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStartGame: () => void;
  onLeaderboardClick: () => void;
  loading: boolean;
  errorMsg: string | null;
};

export function WelcomeScreen(
  {
    playerName,
    onPlayerNameChange,
    onStartGame,
    onLeaderboardClick,
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
        <div class="w-64 mx-auto">
          <div class="mb-4">
            <input
              type="text"
              placeholder="Enter your name, adventurer..."
              maxLength={30}
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
          <div class="flex gap-3 mt-3">
            <a
              href="/how-to-play"
              class="flex-1 px-6 py-3 rounded-sm border border-dungeon-border text-parchment-dark hover:text-parchment hover:border-parchment-dark font-body text-lg transition-colors duration-200 inline-block text-center"
            >
              How to Play
            </a>
            <button
              type="button"
              class="flex-1 px-6 py-3 rounded-sm border border-dungeon-border text-parchment-dark hover:text-parchment hover:border-parchment-dark font-body text-lg transition-colors duration-200"
              onClick={onLeaderboardClick}
            >
              Leaderboard
            </button>
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
