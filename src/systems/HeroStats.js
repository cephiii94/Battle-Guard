import equipmentSets from '../data/equipmentSets.js';

const MAX_HERO_LEVEL = 30;

export function calculateFinalStats(baseHeroStats, equippedItems, activeSkin, level = 1) {
  const clampedLevel = Math.min(level, MAX_HERO_LEVEL);
  const finalStats = { ...baseHeroStats };
  const sg = baseHeroStats.statGrowth;

  if (sg) {
    // Per-hero stat growth: each stat scales at its own rate
    const applyGrowth = (key) => {
      if (sg[key] !== undefined && finalStats[key] !== undefined) {
        finalStats[key] = finalStats[key] * (1 + (clampedLevel - 1) * sg[key]);
      }
    };
    applyGrowth('hp');
    applyGrowth('damage');
    applyGrowth('attackSpeed');
    applyGrowth('attackRange');
    applyGrowth('moveSpeed');
    applyGrowth('criticalChance');
    applyGrowth('healthRegen');
    applyGrowth('armor');
    applyGrowth('lifesteal');
    applyGrowth('evasion');
    applyGrowth('cooldownReduction');
  } else {
    // Fallback: uniform +5% per level for all core stats
    const levelMultiplier = 1 + (clampedLevel - 1) * 0.05;
    finalStats.hp *= levelMultiplier;
    finalStats.damage *= levelMultiplier;
    if (finalStats.healthRegen) finalStats.healthRegen *= levelMultiplier;
    if (finalStats.armor)       finalStats.armor       *= levelMultiplier;
    if (finalStats.lifesteal)   finalStats.lifesteal   *= levelMultiplier;
  }

  // Apply equipment bonuses (flat, added after scaling)
  equippedItems.forEach((item) => {
    Object.entries(item.bonus).forEach(([statName, value]) => {
      finalStats[statName] += value;
    });
  });

  // Apply equipment set bonuses
  const equippedIds = equippedItems.map((item) => item.id);
  equipmentSets.forEach((set) => {
    const equippedCount = set.items.filter((itemId) => equippedIds.includes(itemId)).length;
    Object.entries(set.bonuses).forEach(([thresholdStr, bonus]) => {
      const threshold = parseInt(thresholdStr, 10);
      if (equippedCount >= threshold) {
        Object.entries(bonus).forEach(([statName, value]) => {
          finalStats[statName] = (finalStats[statName] || 0) + value;
        });
      }
    });
  });

  // Apply skin scaling bonus
  const skinBonus = activeSkin.getScalingBonus(clampedLevel, baseHeroStats);
  Object.entries(skinBonus).forEach(([statName, value]) => {
    finalStats[statName] += value;
  });

  return roundStats(finalStats);
}

export { MAX_HERO_LEVEL };

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
    cooldownReduction: roundTo(stats.cooldownReduction || 0, 2),
    attackType: stats.attackType || 'ranged'
  };
}

function roundTo(value, decimals) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}
