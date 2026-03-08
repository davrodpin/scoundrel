import type { Card, GameState } from "@scoundrel/engine";
import { cardValue } from "@scoundrel/engine";

type FightOverlayData = {
  canUseWeapon: boolean;
  weaponDamage: number;
  barehandedDamage: number;
};

export function computeFightOverlayData(
  state: GameState,
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
