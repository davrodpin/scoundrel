import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { type Card, type GameAction, getCardType } from "@scoundrel/engine";
import type { GameView, LeaderboardEntry } from "@scoundrel/game-service";
import { computeFightOverlayData } from "../components/game/fight_overlay_utils.ts";
import { computeTooltip } from "../components/game/tooltip_utils.ts";
import { HealthDisplay } from "../components/game/HealthDisplay.tsx";
import { DungeonPile } from "../components/game/DungeonPile.tsx";
import { DiscardPile } from "../components/game/DiscardPile.tsx";
import { RoomArea } from "../components/game/RoomArea.tsx";
import { EquippedWeaponArea } from "../components/game/EquippedWeaponArea.tsx";
import { ActionBar } from "../components/game/ActionBar.tsx";
import { GameOverOverlay } from "../components/game/GameOverOverlay.tsx";
import { RulesPanel } from "../components/game/RulesPanel.tsx";
import { RulesToggleButton } from "../components/game/RulesToggleButton.tsx";
import { LeaderboardPanel } from "../components/game/LeaderboardPanel.tsx";
import { LeaderboardToggleButton } from "../components/game/LeaderboardToggleButton.tsx";
import { getErrorMessage, resolveLoadGameError } from "./game_resume_utils.ts";
import { getAllCardImagePaths } from "@scoundrel/game";

type GameBoardProps = { gameId?: string };

export default function GameBoard({ gameId: initialGameId }: GameBoardProps) {
  const gameView = useSignal<GameView | null>(null);
  const playerName = useSignal("");
  const showRules = useSignal(false);
  const showLeaderboard = useSignal(false);
  const leaderboardEntries = useSignal<LeaderboardEntry[]>([]);
  const leaderboardLoading = useSignal(false);
  const showFightOverlay = useSignal(false);
  const pendingMonsterIndex = useSignal<number | null>(null);
  const damageFlash = useSignal(false);
  const healFlash = useSignal(false);
  const errorMsg = useSignal<string | null>(null);
  const loading = useSignal(false);
  const resumeLoading = useSignal(!!initialGameId);
  const resumeError = useSignal<string | null>(null);
  const copiedLink = useSignal(false);

  async function fetchLeaderboard() {
    leaderboardLoading.value = true;
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        leaderboardEntries.value = await res.json() as LeaderboardEntry[];
      }
    } catch {
      // Non-critical — silently fail
    } finally {
      leaderboardLoading.value = false;
    }
  }

  async function loadGame(id: string) {
    resumeLoading.value = true;
    resumeError.value = null;
    try {
      const res = await fetch(`/api/games/${id}`);
      const data = await res.json().catch(() => null);
      const errMsg = resolveLoadGameError(res.ok, res.status, data);
      if (errMsg !== null) {
        resumeError.value = errMsg;
        return;
      }
      gameView.value = data as GameView;
      playerName.value = (data as GameView).playerName;
      if ((data as GameView).phase.kind === "game_over") {
        await fetchLeaderboard();
      }
    } catch {
      resumeError.value = "Failed to load game";
    } finally {
      resumeLoading.value = false;
    }
  }

  useEffect(() => {
    if (initialGameId) {
      loadGame(initialGameId);
    }
  }, []);

  useEffect(() => {
    for (const path of getAllCardImagePaths()) {
      const img = new Image();
      img.src = path;
    }
  }, []);

  async function startNewGame() {
    loading.value = true;
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.value.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        errorMsg.value = getErrorMessage(errData);
        return;
      }
      const view: GameView = await res.json();
      gameView.value = view;
      globalThis.history?.replaceState(null, "", `/play/${view.gameId}`);
      showFightOverlay.value = false;
      pendingMonsterIndex.value = null;
      errorMsg.value = null;
      showLeaderboard.value = false;
    } catch {
      errorMsg.value = "Failed to create game";
    } finally {
      loading.value = false;
    }
  }

  async function dispatch(action: GameAction) {
    const view = gameView.value;
    if (!view) return;

    const prevHealth = view.health;
    loading.value = true;

    try {
      const res = await fetch(`/api/games/${view.gameId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.value = getErrorMessage(data);
        return;
      }

      errorMsg.value = null;
      const newView = data as GameView;
      gameView.value = newView;

      if (newView.phase.kind === "game_over") {
        await fetchLeaderboard();
      }

      // Flash animations
      if (newView.health < prevHealth) {
        damageFlash.value = true;
        setTimeout(() => {
          damageFlash.value = false;
        }, 400);
      } else if (newView.health > prevHealth) {
        healFlash.value = true;
        setTimeout(() => {
          healFlash.value = false;
        }, 500);
      }
    } catch {
      errorMsg.value = "Network error";
    } finally {
      loading.value = false;
    }
  }

  function handleDrawCard() {
    dispatch({ type: "draw_card" });
  }

  function handleAvoidRoom() {
    dispatch({ type: "avoid_room" });
  }

  function handleCardClick(index: number) {
    const view = gameView.value;
    if (!view) return;

    const card = view.room[index];
    if (!card) return;

    const cardType = getCardType(card);

    if (cardType === "monster") {
      pendingMonsterIndex.value = index;
      showFightOverlay.value = true;
    } else {
      // Weapon or potion — backend auto-enters room
      dispatch({
        type: "choose_card",
        cardIndex: index,
        fightWith: "barehanded",
      });
    }
  }

  function handleFightChoice(fightWith: "weapon" | "barehanded") {
    const idx = pendingMonsterIndex.value;
    if (idx === null) return;
    showFightOverlay.value = false;
    pendingMonsterIndex.value = null;
    // Backend auto-enters room when receiving choose_card during room_ready
    dispatch({ type: "choose_card", cardIndex: idx, fightWith });
  }

  function handleFightCancel() {
    showFightOverlay.value = false;
    pendingMonsterIndex.value = null;
  }

  function handleCopyLink() {
    const gameId = gameView.value?.gameId;
    if (!gameId) return;
    const url = `${globalThis.location?.origin ?? ""}/play/${gameId}`;
    navigator.clipboard.writeText(url).then(() => {
      copiedLink.value = true;
      setTimeout(() => {
        copiedLink.value = false;
      }, 2000);
    }).catch(() => {});
  }

  // Resume loading state
  if (resumeLoading.value) {
    return (
      <div class="min-h-screen bg-dungeon-bg flex items-center justify-center">
        <p class="text-parchment font-body text-xl">Loading game...</p>
      </div>
    );
  }

  // Resume error state
  if (resumeError.value !== null) {
    return (
      <div class="min-h-screen bg-dungeon-bg flex flex-col items-center justify-center gap-4">
        <p class="text-blood-bright font-body text-xl">{resumeError.value}</p>
        <a
          href="/play"
          class="px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body text-lg transition-colors duration-200"
        >
          Start New Game
        </a>
      </div>
    );
  }

  // Initial screen - no game started
  const state = gameView.value;
  if (!state) {
    const trimmedName = playerName.value.trim();
    return (
      <div class="min-h-screen bg-dungeon-bg flex flex-col items-center justify-center">
        <div class="text-center">
          <h1 class="font-heading text-5xl text-parchment mb-4">Scoundrel</h1>
          <p class="text-parchment-dark font-body mb-8">
            A Single Player Rogue-like Card Game
          </p>
          <div class="mb-4">
            <input
              type="text"
              placeholder="Enter your name, adventurer..."
              maxLength={30}
              value={playerName.value}
              onInput={(e) => {
                playerName.value = (e.target as HTMLInputElement).value;
              }}
              class="w-64 px-4 py-2 rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment font-body placeholder-parchment-dark/50 focus:outline-none focus:border-torch-amber transition-colors duration-200"
            />
          </div>
          <div class="flex gap-3 justify-center">
            <button
              type="button"
              class="px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={startNewGame}
              disabled={loading.value || trimmedName.length === 0}
            >
              Enter the Dungeon
            </button>
            <a
              href="/how-to-play"
              class="px-6 py-3 rounded-sm border border-dungeon-border text-parchment-dark hover:text-parchment hover:border-parchment-dark font-body text-lg transition-colors duration-200 inline-block"
            >
              How to Play
            </a>
          </div>
          {errorMsg.value && (
            <p class="text-blood-bright font-body text-sm mt-3">
              {errorMsg.value}
            </p>
          )}
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

  const isInteractive = (state.phase.kind === "room_ready" ||
    state.phase.kind === "choosing") && !loading.value;
  const isGameOver = state.phase.kind === "game_over";
  const cardsChosen = state.phase.kind === "choosing"
    ? state.phase.cardsChosen
    : 0;

  const tooltips = isInteractive
    ? (state.room as Card[]).map((card) => computeTooltip(card, state))
    : undefined;

  // Compute fight overlay props for inline overlay on monster card
  const fightOverlayProps =
    showFightOverlay.value && pendingMonsterIndex.value !== null
      ? (() => {
        const monster = state.room[pendingMonsterIndex.value!];
        if (!monster) return undefined;
        const data = computeFightOverlayData(state, monster);
        return {
          ...data,
          onChoose: handleFightChoice,
          onCancel: handleFightCancel,
        };
      })()
      : undefined;

  function handleToggleRules() {
    showRules.value = !showRules.value;
    showLeaderboard.value = false;
  }

  function handleCloseRules() {
    showRules.value = false;
  }

  function handleToggleLeaderboard() {
    showLeaderboard.value = !showLeaderboard.value;
    showRules.value = false;
    if (!showLeaderboard.value) return;
    fetchLeaderboard();
  }

  function handleCloseLeaderboard() {
    showLeaderboard.value = false;
  }

  return (
    <div class="min-h-screen bg-dungeon-bg text-parchment p-4 font-body flex flex-col items-center">
      {/* Rules toggle + panel */}
      <RulesToggleButton onClick={handleToggleRules} />
      <RulesPanel open={showRules.value} onClose={handleCloseRules} />

      {/* Leaderboard toggle + panel */}
      <LeaderboardToggleButton onClick={handleToggleLeaderboard} />
      <LeaderboardPanel
        open={showLeaderboard.value}
        loading={leaderboardLoading.value}
        entries={leaderboardEntries.value}
        currentGameId={state?.gameId ?? null}
        onClose={handleCloseLeaderboard}
      />

      {/* Health Display */}
      <HealthDisplay
        health={state.health}
        maxHealth={20}
        playerName={state.playerName}
        damageFlash={damageFlash.value}
        healFlash={healFlash.value}
      />

      {/* Copy link button */}
      <div class="fixed top-4 right-24 z-30 group">
        <button
          type="button"
          onClick={handleCopyLink}
          class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
          aria-label={copiedLink.value ? "Link copied!" : "Copy shareable link"}
        >
          {copiedLink.value
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
        <div class="pointer-events-none absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
          <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm whitespace-nowrap">
            {copiedLink.value ? "Copied!" : "Copy link"}
          </div>
          <div class="absolute bottom-full right-3 border-4 border-transparent border-b-dungeon-border" />
        </div>
      </div>

      {/* Main play area */}
      <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-start w-full max-w-6xl">
        {/* Dungeon pile */}
        <DungeonPile
          count={state.dungeonCount}
          interactive={state.phase.kind === "drawing" &&
            state.dungeonCount > 0 && !loading.value}
          onClick={handleDrawCard}
        />

        {/* Room */}
        <RoomArea
          cards={state.room as Card[]}
          onCardClick={handleCardClick}
          interactive={isInteractive}
          tooltips={tooltips}
          fightIndex={pendingMonsterIndex.value}
          fightProps={fightOverlayProps}
        />

        {/* Discard pile */}
        <DiscardPile count={state.discardCount} />
      </div>

      {/* Action Bar */}
      <ActionBar
        phase={state.phase}
        lastRoomAvoided={state.lastRoomAvoided}
        onAvoidRoom={handleAvoidRoom}
        cardsChosen={cardsChosen}
      />

      {/* Error message */}
      {errorMsg.value && (
        <div class="text-center text-blood-bright text-sm mt-2 font-body">
          {errorMsg.value}
        </div>
      )}

      {/* Equipped Weapon */}
      <EquippedWeaponArea weapon={state.equippedWeapon} />

      {/* Game Over Overlay */}
      {isGameOver && state.phase.kind === "game_over" && (
        <GameOverOverlay
          reason={state.phase.reason}
          score={state.score ?? 0}
          onNewGame={startNewGame}
          leaderboardEntries={leaderboardEntries.value}
          currentGameId={state.gameId}
          errorMessage={errorMsg.value}
          loading={loading.value}
        />
      )}
    </div>
  );
}
