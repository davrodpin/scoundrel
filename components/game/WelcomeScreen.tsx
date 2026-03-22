/** @jsxImportSource preact */
import type { DeckInfo } from "@scoundrel/game";
import BuyMeCoffeeButton from "./BuyMeCoffeeButton.tsx";
import { FloatingCardRiver } from "./FloatingCardRiver.tsx";

type WelcomeScreenProps = {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStartGame: () => void;
  loading: boolean;
  errorMsg: string | null;
  decks: DeckInfo[];
  selectedDeckId: string;
  onDeckChange: (deckId: string) => void;
  decksLoading: boolean;
  onToggleFeedback?: () => void;
};

export function WelcomeScreen(
  {
    playerName,
    onPlayerNameChange,
    onStartGame,
    loading,
    errorMsg,
    decks,
    selectedDeckId,
    onDeckChange,
    decksLoading,
    onToggleFeedback,
  }: WelcomeScreenProps,
) {
  const trimmedName = playerName.trim();
  return (
    <div class="relative overflow-hidden min-h-dvh bg-dungeon-bg flex flex-col items-center">
      <FloatingCardRiver decks={decks} />
      <div class="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading && trimmedName.length > 0) {
                  onStartGame();
                }
              }}
              class="w-full px-4 py-2 rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment font-body placeholder-parchment-dark/50 focus:outline-none focus:border-torch-amber transition-colors duration-200"
            />
          </div>
          {decks.length > 1 && (
            <div class="mb-4 flex items-center gap-2">
              <span class="text-parchment-dark font-body text-sm whitespace-nowrap">
                Deck:
              </span>
              <select
                value={selectedDeckId}
                disabled={decksLoading}
                onChange={(e) =>
                  onDeckChange((e.target as HTMLSelectElement).value)}
                class="flex-1 px-4 py-2 rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment font-body focus:outline-none focus:border-torch-amber focus:ring-1 focus:ring-torch-amber/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            class="w-full px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onStartGame}
            disabled={loading || trimmedName.length === 0 || decksLoading}
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
              Death Ledger
            </a>
            {onToggleFeedback && (
              <>
                <span class="text-parchment-dark/50 text-sm">·</span>
                <button
                  type="button"
                  onClick={onToggleFeedback}
                  class="text-sm font-body text-parchment-dark hover:text-torch-amber transition-colors duration-200"
                >
                  Send Feedback
                </button>
              </>
            )}
          </div>
          <BuyMeCoffeeButton />
          {errorMsg && (
            <p class="text-blood-bright font-body text-sm mt-3">{errorMsg}</p>
          )}
        </div>
      </div>
      <footer class="mt-auto pb-4 text-parchment-dark/50 font-body text-xs text-center px-4 max-w-lg">
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
