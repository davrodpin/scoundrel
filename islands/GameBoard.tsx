import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { type Card, type GameAction } from "@scoundrel/engine";
import type {
  GameView,
  LeaderboardEntry,
  LeaderboardResponse,
} from "@scoundrel/game-service";
import { computeActionPanel } from "../components/game/action_panel_utils.ts";
import { HealthDisplay } from "../components/game/HealthDisplay.tsx";
import type { HealthDisplayActions } from "../components/game/HealthDisplay.tsx";
import { DungeonPile } from "../components/game/DungeonPile.tsx";
import { DiscardPile } from "../components/game/DiscardPile.tsx";
import { RoomArea } from "../components/game/RoomArea.tsx";
import {
  EquippedWeaponCard,
  LastSlainCard,
} from "../components/game/EquippedWeaponArea.tsx";
import { ActionBar } from "../components/game/ActionBar.tsx";
import { GameSection } from "../components/game/GameSection.tsx";
import { GameOverOverlay } from "../components/game/GameOverOverlay.tsx";
import { RulesPanel } from "../components/game/RulesPanel.tsx";
import { LeaderboardPanel } from "../components/game/LeaderboardPanel.tsx";
import { FeedbackPanel } from "../components/game/FeedbackPanel.tsx";
import { WelcomeScreen } from "../components/game/WelcomeScreen.tsx";
import { MobileDungeonButton } from "../components/game/MobileDungeonButton.tsx";
import { MobileCardActionOverlay } from "../components/game/MobileCardActionOverlay.tsx";
import { MobileTopBar } from "../components/game/MobileTopBar.tsx";
import { MobileAvoidRoomButton } from "../components/game/MobileAvoidRoomButton.tsx";
import { getErrorMessage, resolveLoadGameError } from "./game_resume_utils.ts";
import { getAllCardImagePaths } from "@scoundrel/game";
import { getAllDeckCardImagePaths } from "@scoundrel/game";
import type { DeckInfo, DeckManifest, DeckMetadata } from "@scoundrel/game";
import { handleKeyboardEvent, type KeyboardState } from "./keyboard_handler.ts";
import {
  isPending,
  isPendingAvoidRoom,
  type PendingAction,
  pendingActionLabel,
} from "./pending_action.ts";
import {
  getInitialDeckId,
  loadDeckPreference,
  saveDeckPreference,
} from "./deck_preference.ts";

type GameBoardProps = { gameId?: string };

export default function GameBoard({ gameId: initialGameId }: GameBoardProps) {
  const gameView = useSignal<GameView | null>(null);
  const playerName = useSignal("");
  const showRules = useSignal(false);
  const showLeaderboard = useSignal(false);
  const leaderboardEntries = useSignal<LeaderboardEntry[]>([]);
  const leaderboardLoading = useSignal(false);
  const playerRank = useSignal<number | null>(null);
  const topPercent = useSignal<number | null>(null);
  const selectedCardIndex = useSignal<number | null>(null);
  const focusedCardIndex = useSignal<number | null>(null);
  const damageFlash = useSignal(false);
  const healFlash = useSignal(false);
  const errorMsg = useSignal<string | null>(null);
  const pendingAction = useSignal<PendingAction>({ kind: "idle" });
  const resumeLoading = useSignal(!!initialGameId);
  const resumeError = useSignal<string | null>(null);
  const copiedLink = useSignal(false);
  const availableDecks = useSignal<DeckInfo[]>([]);
  const selectedDeckId = useSignal(loadDeckPreference() ?? "dungeon");
  const decksLoading = useSignal(true);
  const showFeedback = useSignal(false);
  const feedbackSubmitting = useSignal(false);
  const feedbackSubmitted = useSignal(false);
  const feedbackError = useSignal<string | null>(null);

  async function fetchLeaderboard() {
    leaderboardLoading.value = true;
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json() as LeaderboardResponse;
        leaderboardEntries.value = data.entries;
      }
    } catch {
      // Non-critical — silently fail
    } finally {
      leaderboardLoading.value = false;
    }
  }

  async function fetchLeaderboardWithRank(gameId: string) {
    leaderboardLoading.value = true;
    try {
      const res = await fetch(`/api/leaderboard?gameId=${gameId}`);
      if (res.ok) {
        const data = await res.json() as LeaderboardResponse;
        leaderboardEntries.value = data.entries;
        if (data.playerRank) {
          playerRank.value = data.playerRank.rank;
          topPercent.value = data.playerRank.topPercent;
        }
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
        await fetchLeaderboardWithRank((data as GameView).gameId);
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
    async function loadDecks() {
      try {
        const manifestRes = await fetch("/decks/manifest.json");
        if (!manifestRes.ok) return;
        const manifest = await manifestRes.json() as DeckManifest;
        selectedDeckId.value = getInitialDeckId(
          manifest.decks,
          manifest.defaultDeck,
        );

        const deckResults = await Promise.all(
          manifest.decks.map(async (deckId) => {
            const deckRes = await fetch(`/decks/${deckId}/deck.json`);
            if (!deckRes.ok) return null;
            const meta = await deckRes.json() as DeckMetadata;
            return {
              id: deckId,
              name: meta.name,
              basePath: `/decks/${deckId}`,
              cards: meta.cards,
            } satisfies DeckInfo;
          }),
        );
        availableDecks.value = deckResults.filter(
          (d): d is DeckInfo => d !== null,
        );
      } catch {
        // Non-critical — fall back to no decks loaded
      } finally {
        decksLoading.value = false;
      }
    }
    loadDecks();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        if (showFeedback.value) {
          showFeedback.value = false;
          e.preventDefault();
          return;
        }
        if (showRules.value) {
          showRules.value = false;
          e.preventDefault();
          return;
        }
        if (showLeaderboard.value) {
          showLeaderboard.value = false;
          e.preventDefault();
          return;
        }
      }

      const view = gameView.value;
      if (!view) return;

      const isLoadingNow = isPending(pendingAction.value);
      const isInteractiveNow = (view.phase.kind === "room_ready" ||
        view.phase.kind === "choosing") && !isLoadingNow;

      const occupiedSlots = (view.room as (Card | null)[])
        .map((card, i) => (card != null ? i : null))
        .filter((i): i is number => i !== null);

      const panelStateNow = computeActionPanel(
        {
          phase: view.phase,
          lastRoomAvoided: view.lastRoomAvoided,
          room: view.room as Card[],
          equippedWeapon: view.equippedWeapon,
          health: view.health,
        },
        isInteractiveNow ? selectedCardIndex.value : null,
      );

      const kbState: KeyboardState = {
        focusedIndex: focusedCardIndex.value,
        selectedIndex: selectedCardIndex.value,
        occupiedSlots,
        isInteractive: isInteractiveNow,
        actions: {
          fightWithWeapon: panelStateNow.fightWithWeapon.enabled &&
            !isLoadingNow,
          avoidRoom: panelStateNow.avoidRoom.enabled && !isLoadingNow,
          drinkPotion: panelStateNow.drinkPotion.enabled && !isLoadingNow,
          fightBarehanded: panelStateNow.fightBarehanded.enabled &&
            !isLoadingNow,
          equipWeapon: panelStateNow.equipWeapon.enabled && !isLoadingNow,
          drawCard: view.phase.kind === "drawing" &&
            view.dungeonCount > 0 && !isLoadingNow,
          openRules: true,
          copyLink: true,
          openLeaderboard: true,
        },
      };

      const intent = handleKeyboardEvent(e.key, kbState);
      if (intent.type === "none") return;

      e.preventDefault();

      switch (intent.type) {
        case "focus_card":
          focusedCardIndex.value = intent.index;
          break;
        case "select_focused":
          selectedCardIndex.value = focusedCardIndex.value;
          break;
        case "deselect":
          selectedCardIndex.value = null;
          focusedCardIndex.value = null;
          break;
        case "action":
          switch (intent.action) {
            case "fightWithWeapon":
              handleFightWithWeapon();
              break;
            case "fightBarehanded":
              handleFightBarehanded();
              break;
            case "avoidRoom":
              handleAvoidRoom();
              break;
            case "drinkPotion":
              handleDrinkPotion();
              break;
            case "equipWeapon":
              handleEquipWeapon();
              break;
            case "drawCard":
              handleDrawCard();
              break;
            case "openRules":
              handleToggleRules();
              break;
            case "copyLink":
              handleCopyLink();
              break;
            case "openLeaderboard":
              handleToggleLeaderboard();
              break;
          }
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function startNewGame() {
    pendingAction.value = { kind: "draw_card" };
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
      selectedCardIndex.value = null;
      errorMsg.value = null;
      showLeaderboard.value = false;
      // Preload card images for the selected deck
      const activeDeck = availableDecks.value.find(
        (d) => d.id === selectedDeckId.value,
      );
      const paths = activeDeck
        ? getAllDeckCardImagePaths(activeDeck)
        : getAllCardImagePaths();
      for (const path of paths) {
        const img = new Image();
        img.src = path;
      }
    } catch {
      errorMsg.value = "Failed to create game";
    } finally {
      pendingAction.value = { kind: "idle" };
    }
  }

  async function dispatch(action: GameAction) {
    const view = gameView.value;
    if (!view) return;

    const prevHealth = view.health;

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
      selectedCardIndex.value = null;
      focusedCardIndex.value = null;

      if (newView.phase.kind === "game_over") {
        await fetchLeaderboardWithRank(newView.gameId);
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
      pendingAction.value = { kind: "idle" };
    }
  }

  function handleDrawCard() {
    pendingAction.value = { kind: "draw_card" };
    dispatch({ type: "draw_card" });
  }

  function handleAvoidRoom() {
    pendingAction.value = { kind: "avoid_room" };
    dispatch({ type: "avoid_room" });
  }

  function handleCardClick(index: number) {
    // Toggle selection: deselect if already selected, otherwise select
    if (selectedCardIndex.value === index) {
      selectedCardIndex.value = null;
    } else {
      selectedCardIndex.value = index;
    }
  }

  function handleFightWithWeapon() {
    const idx = selectedCardIndex.value;
    if (idx === null) return;
    pendingAction.value = {
      kind: "choose_card",
      cardIndex: idx,
      actionType: "fight_weapon",
    };
    dispatch({ type: "choose_card", cardIndex: idx, fightWith: "weapon" });
  }

  function handleFightBarehanded() {
    const idx = selectedCardIndex.value;
    if (idx === null) return;
    pendingAction.value = {
      kind: "choose_card",
      cardIndex: idx,
      actionType: "fight_barehanded",
    };
    dispatch({ type: "choose_card", cardIndex: idx, fightWith: "barehanded" });
  }

  function handleEquipWeapon() {
    const idx = selectedCardIndex.value;
    if (idx === null) return;
    pendingAction.value = {
      kind: "choose_card",
      cardIndex: idx,
      actionType: "equip_weapon",
    };
    dispatch({ type: "choose_card", cardIndex: idx, fightWith: "barehanded" });
  }

  function handleDrinkPotion() {
    const idx = selectedCardIndex.value;
    if (idx === null) return;
    pendingAction.value = {
      kind: "choose_card",
      cardIndex: idx,
      actionType: "drink_potion",
    };
    dispatch({ type: "choose_card", cardIndex: idx, fightWith: "barehanded" });
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

  function handleBackToMenu() {
    if (!globalThis.confirm("Flee the dungeon? Your progress will be lost.")) {
      return;
    }
    gameView.value = null;
    selectedCardIndex.value = null;
    focusedCardIndex.value = null;
    pendingAction.value = { kind: "idle" };
    errorMsg.value = null;
  }

  // Resume loading state
  if (resumeLoading.value) {
    return (
      <div class="min-h-dvh bg-dungeon-bg flex items-center justify-center">
        <p class="text-parchment font-body text-xl">Loading game...</p>
      </div>
    );
  }

  // Resume error state
  if (resumeError.value !== null) {
    return (
      <div class="min-h-dvh bg-dungeon-bg flex flex-col items-center justify-center gap-4">
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

  const isLoading = isPending(pendingAction.value);

  // Initial screen - no game started
  const state = gameView.value;
  if (!state) {
    return (
      <>
        <WelcomeScreen
          playerName={playerName.value}
          onPlayerNameChange={(name) => {
            playerName.value = name;
          }}
          onStartGame={startNewGame}
          loading={isLoading}
          errorMsg={errorMsg.value}
          decks={availableDecks.value}
          selectedDeckId={selectedDeckId.value}
          onDeckChange={(id) => {
            selectedDeckId.value = id;
            saveDeckPreference(id);
          }}
          decksLoading={decksLoading.value}
          onToggleFeedback={handleToggleFeedback}
        />
        <FeedbackPanel
          open={showFeedback.value}
          onClose={handleCloseFeedback}
          onSubmit={handleSubmitFeedback}
          submitting={feedbackSubmitting.value}
          submitted={feedbackSubmitted.value}
          errorMsg={feedbackError.value}
          maxMessageLength={2000}
        />
      </>
    );
  }

  const activeDeck = availableDecks.value.find(
    (d) => d.id === selectedDeckId.value,
  );

  const isInteractive = (state.phase.kind === "room_ready" ||
    state.phase.kind === "choosing") && !isLoading;
  const isGameOver = state.phase.kind === "game_over";
  const cardsChosen = state.phase.kind === "choosing"
    ? state.phase.cardsChosen
    : 0;

  // Compute action panel state
  const panelState = computeActionPanel(
    {
      phase: state.phase,
      lastRoomAvoided: state.lastRoomAvoided,
      room: state.room as Card[],
      equippedWeapon: state.equippedWeapon,
      health: state.health,
    },
    isInteractive ? selectedCardIndex.value : null,
  );

  const actions: HealthDisplayActions = {
    avoidRoom: {
      enabled: panelState.avoidRoom.enabled && !isLoading,
      onClick: handleAvoidRoom,
    },
    fightWithWeapon: {
      enabled: panelState.fightWithWeapon.enabled && !isLoading,
      tooltip: panelState.fightWithWeapon.tooltip,
      onClick: handleFightWithWeapon,
    },
    fightBarehanded: {
      enabled: panelState.fightBarehanded.enabled && !isLoading,
      tooltip: panelState.fightBarehanded.tooltip,
      onClick: handleFightBarehanded,
    },
    equipWeapon: {
      enabled: panelState.equipWeapon.enabled && !isLoading,
      tooltip: panelState.equipWeapon.tooltip,
      onClick: handleEquipWeapon,
    },
    drinkPotion: {
      enabled: panelState.drinkPotion.enabled && !isLoading,
      tooltip: panelState.drinkPotion.tooltip,
      onClick: handleDrinkPotion,
    },
  };

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

  function handleToggleFeedback() {
    showFeedback.value = !showFeedback.value;
    showRules.value = false;
    showLeaderboard.value = false;
    if (!showFeedback.value) return;
    feedbackSubmitted.value = false;
    feedbackError.value = null;
  }

  function handleCloseFeedback() {
    showFeedback.value = false;
  }

  async function handleSubmitFeedback(
    message: string,
    email?: string,
  ): Promise<void> {
    feedbackSubmitting.value = true;
    feedbackError.value = null;
    try {
      const resp = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email, gameId: state?.gameId }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        feedbackError.value = getErrorMessage(data);
        return;
      }
      feedbackSubmitted.value = true;
      setTimeout(() => {
        showFeedback.value = false;
        feedbackSubmitted.value = false;
      }, 2000);
    } catch {
      feedbackError.value = "Something went wrong. Please try again.";
    } finally {
      feedbackSubmitting.value = false;
    }
  }

  const isDrawPhase = state.phase.kind === "drawing";
  const isDungeonInteractive = isDrawPhase && state.dungeonCount > 0 &&
    !isLoading;
  const isDungeonPending = isDrawPhase &&
    pendingAction.value.kind === "draw_card";

  return (
    <div
      class="min-h-dvh bg-dungeon-bg text-parchment p-2 md:p-4 font-body flex flex-col items-center"
      onClick={() => {
        selectedCardIndex.value = null;
        focusedCardIndex.value = null;
      }}
    >
      {/* Rules panel */}
      <RulesPanel open={showRules.value} onClose={handleCloseRules} />

      {/* Leaderboard panel */}
      <LeaderboardPanel
        open={showLeaderboard.value}
        loading={leaderboardLoading.value}
        entries={leaderboardEntries.value}
        currentGameId={state?.gameId ?? null}
        onClose={handleCloseLeaderboard}
      />

      {/* Feedback panel */}
      <FeedbackPanel
        open={showFeedback.value}
        onClose={handleCloseFeedback}
        onSubmit={handleSubmitFeedback}
        submitting={feedbackSubmitting.value}
        submitted={feedbackSubmitted.value}
        errorMsg={feedbackError.value}
        maxMessageLength={2000}
      />

      {/* ── DESKTOP LAYOUT (hidden on mobile) ── */}
      <div class="hidden md:flex md:flex-col md:items-center w-full">
        {/* Shared container: Health Display + game grid share the same width */}
        <div class="w-fit">
          {/* Health Display */}
          <HealthDisplay
            health={state.health}
            maxHealth={20}
            playerName={state.playerName}
            damageFlash={damageFlash.value}
            healFlash={healFlash.value}
            actions={actions}
            toolButtons={{
              onBackToMenu: handleBackToMenu,
              onCopyLink: handleCopyLink,
              onToggleLeaderboard: handleToggleLeaderboard,
              onToggleRules: handleToggleRules,
              onToggleFeedback: handleToggleFeedback,
              copiedLink: copiedLink.value,
            }}
          />

          {/* Main play area */}
          <div class="grid grid-cols-[auto_auto_auto] gap-4 items-stretch">
            {/* Dungeon pile */}
            <GameSection label="Dungeon">
              <DungeonPile
                count={state.dungeonCount}
                interactive={isDungeonInteractive}
                onClick={handleDrawCard}
                pending={isDungeonPending}
                deck={activeDeck}
              />
            </GameSection>

            {/* Room */}
            <GameSection label="Room">
              <RoomArea
                cards={state.room as Card[]}
                onCardClick={isInteractive ? handleCardClick : undefined}
                interactive={isInteractive}
                selectedIndex={selectedCardIndex.value}
                focusedIndex={focusedCardIndex.value}
                pendingAction={pendingAction.value}
                deck={activeDeck}
              />
            </GameSection>

            {/* Discard pile */}
            <GameSection label="Discard">
              <DiscardPile count={state.discardCount} deck={activeDeck} />
            </GameSection>
          </div>
        </div>

        {/* Action Bar */}
        <ActionBar
          phase={state.phase}
          cardsChosen={cardsChosen}
          lastRoomAvoided={state.lastRoomAvoided}
          cardSelected={selectedCardIndex.value !== null}
          roomSize={state.room.length}
          panelState={panelState}
          pendingAction={pendingAction.value}
        />

        {/* Error message */}
        {errorMsg.value && (
          <div class="text-center text-blood-bright text-sm mt-2 font-body">
            {errorMsg.value}
          </div>
        )}

        {/* Equipped Weapon */}
        <div class="flex gap-4 justify-center w-full max-w-6xl">
          <GameSection label="Equipped Weapon">
            <EquippedWeaponCard
              weapon={state.equippedWeapon}
              deck={activeDeck}
            />
          </GameSection>
          <GameSection label="Last Monster Slain">
            <LastSlainCard
              card={state.equippedWeapon?.slainMonsters.at(-1) ?? null}
              deck={activeDeck}
            />
          </GameSection>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (hidden on desktop) ── */}
      <div class="flex md:hidden flex-col w-full gap-2">
        {/* Top bar: health + icon buttons */}
        <MobileTopBar
          health={state.health}
          maxHealth={20}
          playerName={state.playerName}
          damageFlash={damageFlash.value}
          healFlash={healFlash.value}
          onBackToMenuClick={handleBackToMenu}
          onRulesClick={handleToggleRules}
          onLeaderboardClick={handleToggleLeaderboard}
          onCopyLinkClick={handleCopyLink}
          onFeedbackClick={handleToggleFeedback}
          copiedLink={copiedLink.value}
        />

        {/* Weapon / Last Slain */}
        <div class="flex gap-2 w-full">
          <div class="flex-1">
            <GameSection label="Equipped Weapon">
              <EquippedWeaponCard
                weapon={state.equippedWeapon}
                deck={activeDeck}
              />
            </GameSection>
          </div>
          <div class="flex-1">
            <GameSection label="Last Monster Slain">
              <LastSlainCard
                card={state.equippedWeapon?.slainMonsters.at(-1) ?? null}
                deck={activeDeck}
              />
            </GameSection>
          </div>
        </div>

        {/* Room */}
        <GameSection label="Room">
          <RoomArea
            cards={state.room as Card[]}
            onCardClick={isInteractive ? handleCardClick : undefined}
            interactive={isInteractive}
            selectedIndex={selectedCardIndex.value}
            focusedIndex={focusedCardIndex.value}
            pendingAction={pendingAction.value}
            deck={activeDeck}
          />
        </GameSection>

        {/* Avoid Room button — shown below Room cards when available */}
        <MobileAvoidRoomButton
          enabled={actions.avoidRoom.enabled}
          onClick={handleAvoidRoom}
          pending={isPendingAvoidRoom(pendingAction.value)}
        />

        {/* Draw button (during draw phase) or hint text */}
        {isDrawPhase
          ? (
            <MobileDungeonButton
              isEmpty={state.dungeonCount === 0}
              interactive={isDungeonInteractive}
              onClick={handleDrawCard}
              pending={isDungeonPending}
            />
          )
          : (
            <ActionBar
              phase={state.phase}
              cardsChosen={cardsChosen}
              lastRoomAvoided={state.lastRoomAvoided}
              cardSelected={selectedCardIndex.value !== null}
              roomSize={state.room.length}
              panelState={panelState}
              pendingAction={pendingAction.value}
              mobileMode
            />
          )}

        {/* Error message */}
        {errorMsg.value && (
          <div class="text-center text-blood-bright text-sm font-body">
            {errorMsg.value}
          </div>
        )}
      </div>

      {/* Mobile action overlay — shown when a card is selected */}
      {selectedCardIndex.value !== null &&
        (state.room as Card[])[selectedCardIndex.value] && (
        <MobileCardActionOverlay
          card={(state.room as Card[])[selectedCardIndex.value]!}
          actions={actions}
          onCancel={() => {
            selectedCardIndex.value = null;
            focusedCardIndex.value = null;
          }}
          deck={activeDeck}
          pendingLabel={pendingActionLabel(pendingAction.value)}
        />
      )}

      {/* Game Over Overlay */}
      {isGameOver && state.phase.kind === "game_over" && (
        <GameOverOverlay
          reason={state.phase.reason}
          score={state.score ?? 0}
          onNewGame={startNewGame}
          errorMessage={errorMsg.value}
          loading={isLoading}
          rank={playerRank.value}
          topPercent={topPercent.value}
          isInTopN={leaderboardEntries.value.some((e) =>
            e.gameId === state.gameId
          )}
          gameId={state.gameId}
          onToggleFeedback={handleToggleFeedback}
        />
      )}
    </div>
  );
}
