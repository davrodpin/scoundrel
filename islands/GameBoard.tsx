import { useComputed, useSignal } from "@preact/signals";
import {
  type Card,
  createGameEngine,
  type EventLog,
  type GameAction,
  type GameState,
  getCardType,
} from "@scoundrel/engine";
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

const engine = createGameEngine();

export default function GameBoard() {
  const eventLog = useSignal<EventLog | null>(null);
  const showRules = useSignal(false);
  const showFightOverlay = useSignal(false);
  const pendingMonsterIndex = useSignal<number | null>(null);
  const damageFlash = useSignal(false);
  const healFlash = useSignal(false);
  const errorMsg = useSignal<string | null>(null);

  const gameState = useComputed<GameState | null>(() => {
    const log = eventLog.value;
    if (!log) return null;
    return engine.getState(log);
  });

  function startNewGame() {
    const { eventLog: log } = engine.createGame();
    eventLog.value = log;
    showFightOverlay.value = false;
    pendingMonsterIndex.value = null;
    errorMsg.value = null;
  }

  function dispatch(action: GameAction) {
    const log = eventLog.value;
    if (!log) return;

    const prevState = engine.getState(log);
    const result = engine.submitAction(log, action);
    if (!result.ok) {
      errorMsg.value = result.error;
      return;
    }

    errorMsg.value = null;
    eventLog.value = result.eventLog;

    // Flash animations
    const newState = result.state;
    if (newState.health < prevState.health) {
      damageFlash.value = true;
      setTimeout(() => {
        damageFlash.value = false;
      }, 400);
    } else if (newState.health > prevState.health) {
      healFlash.value = true;
      setTimeout(() => {
        healFlash.value = false;
      }, 500);
    }
  }

  function handleDrawCard() {
    dispatch({ type: "draw_card" });
  }

  function handleAvoidRoom() {
    dispatch({ type: "avoid_room" });
  }

  function autoEnterRoom(): boolean {
    const log = eventLog.value;
    if (!log) return false;
    const state = engine.getState(log);
    if (state.phase.kind !== "room_ready") return true;

    const enterResult = engine.submitAction(log, { type: "enter_room" });
    if (!enterResult.ok) {
      errorMsg.value = enterResult.error;
      return false;
    }
    eventLog.value = enterResult.eventLog;
    errorMsg.value = null;
    return true;
  }

  function handleCardClick(index: number) {
    const state = gameState.value;
    if (!state) return;

    const card = state.room[index];
    if (!card) return;

    const cardType = getCardType(card);

    if (cardType === "monster") {
      // Show fight overlay without entering the room yet.
      // The room will be entered only when the player confirms the fight.
      pendingMonsterIndex.value = index;
      showFightOverlay.value = true;
    } else {
      // Weapon or potion — auto-enter room and choose immediately
      if (!autoEnterRoom()) return;
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
    // Enter the room now that the player has committed to fighting
    if (!autoEnterRoom()) return;
    dispatch({ type: "choose_card", cardIndex: idx, fightWith });
  }

  function handleFightCancel() {
    showFightOverlay.value = false;
    pendingMonsterIndex.value = null;
  }

  // Initial screen - no game started
  const state = gameState.value;
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
          >
            Enter the Dungeon
          </button>
        </div>
      </div>
    );
  }

  const isInteractive = state.phase.kind === "room_ready" ||
    state.phase.kind === "choosing";
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
          count={state.dungeon.length}
          interactive={state.phase.kind === "drawing" &&
            state.dungeon.length > 0}
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
        <DiscardPile count={state.discard.length} />
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

      {/* Turn info */}
      <div class="text-center mt-4 text-parchment-dark text-xs font-body">
        Turn {state.turnNumber}
      </div>

      {/* Game Over Overlay */}
      {isGameOver && state.phase.kind === "game_over" && (
        <GameOverOverlay
          reason={state.phase.reason}
          score={engine.getScore(state)}
          onNewGame={startNewGame}
        />
      )}
    </div>
  );
}
