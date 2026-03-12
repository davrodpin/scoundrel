import type { Card, EquippedWeapon, GamePhase } from "@scoundrel/engine";
import { cardValue, getCardType } from "@scoundrel/engine";
import { computeTooltip } from "./tooltip_utils.ts";

export type ActionPanelInput = {
  phase: GamePhase;
  lastRoomAvoided: boolean;
  room: readonly Card[];
  equippedWeapon: EquippedWeapon | null;
  health: number;
};

export type ActionButton = {
  enabled: boolean;
  tooltip: string;
};

export type ActionPanelState = {
  avoidRoom: { enabled: boolean };
  fightWithWeapon: ActionButton;
  fightBarehanded: ActionButton;
  equipWeapon: ActionButton;
  drinkPotion: ActionButton;
};

function canWeaponFight(weapon: EquippedWeapon, monster: Card): boolean {
  const { slainMonsters } = weapon;
  if (slainMonsters.length === 0) return true;
  return monster.rank <= slainMonsters[slainMonsters.length - 1].rank;
}

export function computeActionPanel(
  state: ActionPanelInput,
  selectedIndex: number | null,
): ActionPanelState {
  const avoidRoomEnabled = state.phase.kind === "room_ready" &&
    !state.lastRoomAvoided;

  const noCard: ActionButton = { enabled: false, tooltip: "" };

  if (selectedIndex === null) {
    return {
      avoidRoom: { enabled: avoidRoomEnabled },
      fightWithWeapon: noCard,
      fightBarehanded: noCard,
      equipWeapon: noCard,
      drinkPotion: noCard,
    };
  }

  const card = state.room[selectedIndex];
  if (!card) {
    return {
      avoidRoom: { enabled: avoidRoomEnabled },
      fightWithWeapon: noCard,
      fightBarehanded: noCard,
      equipWeapon: noCard,
      drinkPotion: noCard,
    };
  }

  const cardType = getCardType(card);

  if (cardType === "monster") {
    const barehandedDamage = cardValue(card);
    const weapon = state.equippedWeapon;

    let fightWithWeapon: ActionButton = noCard;
    if (weapon) {
      const canFight = canWeaponFight(weapon, card);
      const weaponDmg = Math.max(0, cardValue(card) - cardValue(weapon.card));
      const tooltip = weaponDmg === 0
        ? "Weapon: no damage"
        : `Weapon: ${weaponDmg} dmg`;
      fightWithWeapon = { enabled: canFight, tooltip };
    }

    return {
      avoidRoom: { enabled: avoidRoomEnabled },
      fightWithWeapon,
      fightBarehanded: {
        enabled: true,
        tooltip: `Barehanded: ${barehandedDamage} dmg`,
      },
      equipWeapon: noCard,
      drinkPotion: noCard,
    };
  }

  if (cardType === "weapon") {
    const tooltipLines = computeTooltip(card, state);
    return {
      avoidRoom: { enabled: avoidRoomEnabled },
      fightWithWeapon: noCard,
      fightBarehanded: noCard,
      equipWeapon: { enabled: true, tooltip: tooltipLines[0] ?? "" },
      drinkPotion: noCard,
    };
  }

  // potion
  const tooltipLines = computeTooltip(card, state);
  return {
    avoidRoom: { enabled: avoidRoomEnabled },
    fightWithWeapon: noCard,
    fightBarehanded: noCard,
    equipWeapon: noCard,
    drinkPotion: { enabled: true, tooltip: tooltipLines[0] ?? "" },
  };
}
