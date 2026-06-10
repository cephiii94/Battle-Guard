export function calculateFinalStats(baseHeroStats, equippedItems, activeSkin, level = 1) {
  const finalStats = { ...baseHeroStats };

  // Base level scaling: +5% HP, Damage, HP Regen, Armor, and Lifesteal per level
  const levelMultiplier = 1 + (level - 1) * 0.05;
  finalStats.hp *= levelMultiplier;
  finalStats.damage *= levelMultiplier;
  if (finalStats.healthRegen) {
    finalStats.healthRegen *= levelMultiplier;
  }
  if (finalStats.armor) {
    finalStats.armor *= levelMultiplier;
  }
  if (finalStats.lifesteal) {
    finalStats.lifesteal *= levelMultiplier;
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
    healthRegen: roundTo(stats.healthRegen || 0, 1),
    armor: Math.round(stats.armor || 0),
    lifesteal: roundTo(stats.lifesteal || 0, 2),
    evasion: roundTo(stats.evasion || 0, 2),
    cooldownReduction: roundTo(stats.cooldownReduction || 0, 2)
  };
}

function roundTo(value, decimals) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}
