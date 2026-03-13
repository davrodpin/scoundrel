import type { GamePhase } from "@scoundrel/engine";
import type { ActionPanelState } from "./action_panel_utils.ts";
import {
  isPending,
  pendingActionLabel,
  type PendingAction,
} from "../../islands/pending_action.ts";

type ActionBarProps = {
  phase: GamePhase;
  cardsChosen?: number;
  lastRoomAvoided: boolean;
  cardSelected: boolean;
  roomSize: number;
  panelState?: ActionPanelState;
  pendingAction?: PendingAction;
};

export function getActionBarHint(
  phase: GamePhase,
  lastRoomAvoided: boolean,
  cardSelected: boolean,
  roomSize: number,
  panelState?: ActionPanelState,
): string {
  if (
    cardSelected &&
    (phase.kind === "room_ready" || phase.kind === "choosing")
  ) {
    if (panelState) {
      const actions: string[] = [];
      if (panelState.avoidRoom.enabled) actions.push("Avoid Room (A)");
      if (panelState.fightWithWeapon.enabled) {
        const dmg = panelState.fightWithWeapon.tooltip.replace("Weapon: ", "");
        actions.push(`Fight w/ Weapon (W): ${dmg}`);
        if (panelState.fightBarehanded.enabled) {
          const bdmg = panelState.fightBarehanded.tooltip.replace(
            "Barehanded: ",
            "",
          );
          actions.push(`Barehanded (B): ${bdmg}`);
        }
      } else if (panelState.fightBarehanded.enabled) {
        const bdmg = panelState.fightBarehanded.tooltip.replace(
          "Barehanded: ",
          "",
        );
        actions.push(`Fight Barehanded (B): ${bdmg}`);
      }
      if (panelState.equipWeapon.enabled) actions.push("Equip Weapon (E)");
      if (panelState.drinkPotion.enabled) {
        const healMatch = panelState.drinkPotion.tooltip.match(
          /Heals (\d+) HP/,
        );
        const heal = healMatch ? `+${healMatch[1]} HP` : "0 HP";
        actions.push(`Drink Potion (P): ${heal}`);
      }

      if (actions.length === 1) {
        return `Card selected. ${actions[0]} or select another card`;
      }
      return `Card selected. ${actions.join(", ")}, or select another card`;
    }
    return "Card selected. Take an action or select another card";
  }
  switch (phase.kind) {
    case "drawing":
      return roomSize > 0
        ? "Draw another card (D)"
        : "Draw a card from the Dungeon (D)";
    case "room_ready":
      return lastRoomAvoided
        ? "Select a card to play (←→ ↩︎)"
        : "Select a card to play (←→ ↩︎) or Avoid Room (A)";
    case "choosing":
      return "Select a card to play (←→ ↩︎)";
    case "game_over":
      return "Game Over";
  }
}

export function ActionBar(
  { phase, lastRoomAvoided, cardSelected, roomSize, panelState, pendingAction }:
    ActionBarProps,
) {
  const pendingLabel = pendingAction && isPending(pendingAction)
    ? pendingActionLabel(pendingAction)
    : null;
  const hint = pendingLabel ?? getActionBarHint(
    phase,
    lastRoomAvoided,
    cardSelected,
    roomSize,
    panelState,
  );
  const isGameOver = phase.kind === "game_over";

  return (
    <div class="flex justify-center gap-3 mt-4 mb-4">
      <div
        class={`font-body text-sm self-center ${
          isGameOver ? "text-parchment-dark" : "text-parchment"
        }`}
      >
        {hint}
      </div>
    </div>
  );
}
