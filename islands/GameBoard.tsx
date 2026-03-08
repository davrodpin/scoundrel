import { useSignal } from "@preact/signals";
import { type Card, type GameAction, getCardType } from "@scoundrel/engine";
import type { GameView } from "@scoundrel/game-service";
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

export default function GameBoard() {
  const gameView = useSignal<GameView | null>(null);
  const showRules = useSignal(false);
  const showFightOverlay = useSignal(false);
  const pendingMonsterIndex = useSignal<number | null>(null);
  const damageFlash = useSignal(false);
  const healFlash = useSignal(false);
  const errorMsg = useSignal<string | null>(null);
  const loading = useSignal(false);

  async function startNewGame() {
    loading.value = true;
    try {
      const res = await fetch("/api/games", { method: "POST" });
      const view: GameView = await res.json();
      gameView.value = view;
      showFightOverlay.value = false;
      pendingMonsterIndex.value = null;
      errorMsg.value = null;
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
        errorMsg.value = data.error?.message ?? "Action failed";
        return;
      }

      errorMsg.value = null;
      gameView.value = data as GameView;

      // Flash animations
      const newView = data as GameView;
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

  // Initial screen - no game started
  const state = gameView.value;
  if (!state) {
    return (
      <div class="min-h-screen bg-dungeon-bg flex items-center justify-center">
        <div class="text-center">
          <h1 class="font-heading text-5xl text-parchment mb-4">Scoundrel</h1>
          <p class="text-parchment-dark font-body mb-8">
            A dungeon crawler card game
          </p>
          <button
            type="button"
            class="px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body text-lg transition-colors duration-200"
            onClick={startNewGame}
            disabled={loading.value}
          >
            Enter the Dungeon
          </button>
        </div>
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
  }

  function handleCloseRules() {
    showRules.value = false;
  }

  return (
    <div class="min-h-screen bg-dungeon-bg text-parchment p-4 font-body">
      {/* Rules toggle + panel */}
      <RulesToggleButton onClick={handleToggleRules} />
      <RulesPanel open={showRules.value} onClose={handleCloseRules} />

      {/* Health Display */}
      <HealthDisplay
        health={state.health}
        maxHealth={20}
        damageFlash={damageFlash.value}
        healFlash={healFlash.value}
      />

      {/* Main play area */}
      <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-start max-w-4xl mx-auto">
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
        />
      )}
    </div>
  );
}
