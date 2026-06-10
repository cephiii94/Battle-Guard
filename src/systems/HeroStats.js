export function calculateFinalStats(baseHeroStats, equippedItems, activeSkin, level = 1) {
  const finalStats = { ...baseHeroStats };

  // Base level scaling: +5% HP, Damage, and HP Regen per level
  const levelMultiplier = 1 + (level - 1) * 0.05;
  finalStats.hp *= levelMultiplier;
  finalStats.damage *= levelMultiplier;
  if (finalStats.healthRegen) {
    finalStats.healthRegen *= levelMultiplier;
  }

  equippedItems.forEach((item) => {
    Object.entries(item.bonus).forEach(([statName, value]) => {
      finalStats[statName] += value;
    });
  });

  const skinBonus = activeSkin.getScalingBonus(level, baseHeroStats);

  Object.entries(skinBonus).forEach(([statName, value]) => {
    finalStats[statName] += value;
  });

  return roundStats(finalStats);
}

export function roundStats(stats) {
  return {
    hp: Math.round(stats.hp),
    damage: roundTo(stats.damage, 1),
    moveSpeed: Math.round(stats.moveSpeed),
    attackSpeed: roundTo(stats.attackSpeed, 2),
    attackRange: Math.round(stats.attackRange),
    criticalChance: roundTo(stats.criticalChance, 2),
    healthRegen: roundTo(stats.healthRegen || 0, 1)
  };
}

function roundTo(value, decimals) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}
