import type { Card, EquippedWeapon, GamePhase } from "@scoundrel/engine";
import { cardValue } from "@scoundrel/engine";

type FightOverlayState = {
  equippedWeapon: EquippedWeapon | null;
  health: number;
  phase: GamePhase;
};

type FightOverlayData = {
  canUseWeapon: boolean;
  weaponDamage: number;
  barehandedDamage: number;
};

export function computeFightOverlayData(
  state: FightOverlayState,
  monster: Card,
): FightOverlayData {
  const barehandedDamage = cardValue(monster);

  if (!state.equippedWeapon) {
    return { canUseWeapon: false, weaponDamage: 0, barehandedDamage };
  }

  const { slainMonsters } = state.equippedWeapon;
  const canUseWeapon = slainMonsters.length === 0 ||
    monster.rank <= slainMonsters[slainMonsters.length - 1].rank;

  const weaponDamage = Math.max(
    0,
    cardValue(monster) - cardValue(state.equippedWeapon.card),
  );

  return { canUseWeapon, weaponDamage, barehandedDamage };
}
