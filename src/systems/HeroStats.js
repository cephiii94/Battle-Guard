const MAX_HERO_LEVEL = 30;

export function calculateFinalStats(baseHeroStats, equippedItems, activeSkin, level = 1, allocatedStats = null, currentClass = 'Novice') {
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

  // Apply skin scaling bonus
  const skinBonus = activeSkin.getScalingBonus(clampedLevel, baseHeroStats);
  Object.entries(skinBonus).forEach(([statName, value]) => {
    finalStats[statName] += value;
  });

  // === RPG CLASS SYSTEM: Apply STR/AGI/INT allocated stats ===
  if (allocatedStats) {
    const str = allocatedStats.strength || 0;
    const agi = allocatedStats.agility  || 0;
    const int = allocatedStats.intelligence || 0;

    // Damage scales based on Main Attribute
    let mainAttrPoints = str; // Default to STR for Novice, Swordsman, Knight
    const agiClasses = ['Archer', 'Hunter', 'Assassin', 'Ranger']; // Future-proofing classes
    const intClasses = ['Mage', 'Wizard', 'Summoner'];

    if (agiClasses.includes(currentClass)) {
      mainAttrPoints = agi;
    } else if (intClasses.includes(currentClass)) {
      mainAttrPoints = int;
    }

    finalStats.damage += mainAttrPoints * 2;

    // STR: HP (+10), HP Regen (+0.1)
    finalStats.hp          += str * 10;
    finalStats.healthRegen = (finalStats.healthRegen || 0) + (str * 0.1);

    // AGI: Atk Speed (+1.5%), Move Speed (+1%), Crit Chance (+0.5%), Evasion (+0.5%)
    finalStats.attackSpeed += (finalStats.attackSpeed || 1) * (agi * 0.015);
    finalStats.moveSpeed   += (finalStats.moveSpeed || 200) * (agi * 0.01);
    finalStats.criticalChance = (finalStats.criticalChance || 0) + (agi * 0.005);
    finalStats.evasion        = (finalStats.evasion || 0) + (agi * 0.005);

    // INT: Cooldown Reduction (+1%), Lifesteal (+0.5%), Armor (+1)
    finalStats.cooldownReduction = (finalStats.cooldownReduction || 0) + (int * 0.01);
    finalStats.lifesteal = (finalStats.lifesteal || 0) + (int * 0.005);
    finalStats.armor     = (finalStats.armor || 0) + (int * 1);
  }
  // === END RPG CLASS SYSTEM ===

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
