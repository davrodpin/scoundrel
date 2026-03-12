import type { Card, EquippedWeapon, GamePhase } from "@scoundrel/engine";
import { cardValue, getCardType } from "@scoundrel/engine";

type TooltipState = {
  equippedWeapon: EquippedWeapon | null;
  health: number;
  phase: GamePhase;
};

function canWeaponFight(state: TooltipState, monster: Card): boolean {
  if (!state.equippedWeapon) return false;
  const { slainMonsters } = state.equippedWeapon;
  if (slainMonsters.length === 0) return true;
  const lastSlain = slainMonsters[slainMonsters.length - 1];
  return monster.rank <= lastSlain.rank;
}

export function computeTooltip(card: Card, state: TooltipState): string[] {
  const type = getCardType(card);
  const value = cardValue(card);

  if (type === "monster") {
    return computeMonsterTooltip(card, value, state);
  }

  if (type === "potion") {
    return computePotionTooltip(value, state);
  }

  return computeWeaponTooltip(value, state);
}

function computeMonsterTooltip(
  card: Card,
  value: number,
  state: TooltipState,
): string[] {
  if (!state.equippedWeapon) {
    return [`Barehanded: ${value} dmg`];
  }

  if (canWeaponFight(state, card)) {
    const weaponDmg = Math.max(0, value - cardValue(state.equippedWeapon.card));
    const weaponLine = weaponDmg === 0
      ? "Weapon: no damage"
      : `Weapon: ${weaponDmg} dmg`;
    return [weaponLine, `Barehanded: ${value} dmg`];
  }

  const lastSlain = state.equippedWeapon.slainMonsters[
    state.equippedWeapon.slainMonsters.length - 1
  ];
  return [
    `Barehanded: ${value} dmg`,
    `Weapon blocked (last slain: ${cardValue(lastSlain)})`,
  ];
}

function computePotionTooltip(value: number, state: TooltipState): string[] {
  if (
    state.phase.kind === "choosing" && state.phase.potionUsedThisTurn
  ) {
    return ["No effect \u2014 potion already used this turn"];
  }

  if (state.health >= 20) {
    return ["Health full \u2014 no effect"];
  }

  const heals = Math.min(value, 20 - state.health);
  return [`Heals ${heals} HP`];
}

export function computeWeaponCardTooltip(weapon: EquippedWeapon): string[] {
  const { slainMonsters } = weapon;
  if (slainMonsters.length === 0) {
    return ["Can fight any monster"];
  }
  const lastSlain = slainMonsters[slainMonsters.length - 1];
  return [`Max target rank: ${cardValue(lastSlain)}`];
}

function computeWeaponTooltip(value: number, state: TooltipState): string[] {
  if (!state.equippedWeapon) {
    return [`Equip (rank ${value})`];
  }

  const currentRank = cardValue(state.equippedWeapon.card);
  const diff = value - currentRank;

  if (diff > 0) {
    return [`Equip (rank ${value}, +${diff})`];
  }
  if (diff < 0) {
    return [`Equip (rank ${value}, \u2212${Math.abs(diff)})`];
  }
  return [`Equip (rank ${value}, same)`];
}
