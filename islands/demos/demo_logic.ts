const MAX_HEALTH = 20;

type CombatResult = {
  damage: number;
  method: "barehanded" | "weapon";
};

type PotionResult = {
  newHealth: number;
  applied: boolean;
  reason?: string;
};

export function computeCombatDamage(
  monsterRank: number,
  weaponRank: number | null,
): CombatResult {
  if (weaponRank === null) {
    return { damage: monsterRank, method: "barehanded" };
  }
  const damage = Math.max(0, monsterRank - weaponRank);
  return { damage, method: "weapon" };
}

export function canWeaponFight(
  lastSlainRank: number | null,
  targetRank: number,
): boolean {
  if (lastSlainRank === null) return true;
  return targetRank <= lastSlainRank;
}

export function applyPotion(
  currentHealth: number,
  potionRank: number,
  potionUsedThisTurn: boolean,
): PotionResult {
  if (potionUsedThisTurn) {
    return {
      newHealth: currentHealth,
      applied: false,
      reason: "only one potion per turn",
    };
  }
  const newHealth = Math.min(MAX_HEALTH, currentHealth + potionRank);
  return { newHealth, applied: true };
}
