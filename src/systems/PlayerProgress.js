import { GameManager } from './GameManager.js';

export function getPlayerProgress() {
  // Return the entire state from GameManager for compatibility
  return GameManager.getState();
}

export function addPlayerGold(scene, amount) {
  const currentGold = GameManager.get('gold') || 0;
  const nextGold = currentGold + amount;
  GameManager.set('gold', nextGold);
  return nextGold;
}

export function addPlayerExp(scene, amount) {
  let level = GameManager.get('playerLevel') || 1;
  let exp = (GameManager.get('playerExp') || 0) + amount;
  let leveledUp = false;
  let levelsGained = 0;

  while (true) {
    const requiredExp = level * 200;
    if (exp >= requiredExp) {
      exp -= requiredExp;
      level += 1;
      leveledUp = true;
      levelsGained++;
    } else {
      break;
    }
  }

  let skillPoints = GameManager.get('skillPoints') || 0;
  if (levelsGained > 0) {
    skillPoints  += levelsGained * 1;
  }

  GameManager.setState({
    playerLevel: level,
    playerExp: exp,
    skillPoints
  });

  return { level, exp, leveledUp, levelsGained, skillPoints };
}

export function addPlayerMaterial(scene, materialId, amount) {
  const materials = GameManager.get('materials') || {};
  const nextMaterials = {
    ...materials,
    [materialId]: Math.max(0, (materials[materialId] || 0) + amount)
  };
  GameManager.set('materials', nextMaterials);
  return GameManager.getState();
}

export function addPlayerTicket(scene, ticketId, amount) {
  const tickets = GameManager.get('tickets') || {};
  const nextTickets = {
    ...tickets,
    [ticketId]: Math.max(0, (tickets[ticketId] || 0) + amount)
  };
  GameManager.set('tickets', nextTickets);
  return GameManager.getState();
}

export function getDailyAttemptsRemaining(scene, mode) {
  const dailyAttempts = GameManager.get('dailyAttempts') || {};
  const key = mode === 'gold_farm' ? 'gold' : (mode === 'looting' ? 'boss' : 'survival');
  return dailyAttempts[key] !== undefined ? dailyAttempts[key] : 3;
}

export function consumeDailyAttempt(scene, mode) {
  const dailyAttempts = GameManager.get('dailyAttempts') || {};
  const key = mode === 'gold_farm' ? 'gold' : (mode === 'looting' ? 'boss' : 'survival');
  
  const currentAttempts = dailyAttempts[key] !== undefined ? dailyAttempts[key] : 3;
  if (currentAttempts > 0) {
    const nextAttempts = { ...dailyAttempts, [key]: currentAttempts - 1 };
    GameManager.set('dailyAttempts', nextAttempts);
    return true;
  }
  return false;
}

export function hasTicket(scene, ticketId) {
  const tickets = GameManager.get('tickets') || {};
  return tickets[ticketId] > 0;
}

export function consumeTicket(scene, ticketId) {
  const tickets = GameManager.get('tickets') || {};
  if (tickets[ticketId] > 0) {
    const nextTickets = { ...tickets, [ticketId]: tickets[ticketId] - 1 };
    GameManager.set('tickets', nextTickets);
    return true;
  }
  return false;
}

export function unlockStage(scene, stageId, completedStageId = null, clearTime = null) {
  const highestStage = GameManager.get('highestStage') || 1;
  const stageTimes = { ...(GameManager.get('stageTimes') || {}) };
  const completedStages = [...(GameManager.get('completedStages') || [])];

  if (completedStageId !== null) {
    if (!completedStages.includes(completedStageId)) {
      completedStages.push(completedStageId);
    }
    if (clearTime !== null) {
      const existingTime = stageTimes[completedStageId];
      if (existingTime === undefined || clearTime < existingTime) {
        stageTimes[completedStageId] = clearTime;
      }
    }
  }

  const nextHighest = Math.max(highestStage, stageId);
  GameManager.setState({
    highestStage: nextHighest,
    completedStages,
    stageTimes
  });
  
  return nextHighest;
}

export function getSkillLevelsForPlayerLevel(roadLevel) {
  const skillsList = [
    'fireball', 'multi-shot', 'lightning-strike', 'spin-attack',
    'magnet', 'movespeed', 'aspd', 'hp-regen', 'shield', 'attack-range', 'knock'
  ];

  const levels = {};
  skillsList.forEach((skillId, index) => {
    let count = 0;
    for (let tier = 0; tier < 5; tier++) {
      const nodeLvl = index + 1 + (tier * 11);
      if (nodeLvl <= roadLevel) {
        count++;
      }
    }
    levels[skillId] = count;
  });
  return levels;
}

export function addHeroXP(scene, heroId, amount) {
  const heroLevels = GameManager.get('heroLevels') || {};
  const heroXP = GameManager.get('heroXP') || {};

  let currentLevel = heroLevels[heroId] || 1;
  let nextXP = (heroXP[heroId] || 0) + amount;
  
  while (true) {
    const requiredXP = currentLevel * 100;
    if (nextXP >= requiredXP) {
      nextXP -= requiredXP;
      currentLevel += 1;
    } else {
      break;
    }
  }
  
  const nextHeroXP = { ...heroXP, [heroId]: nextXP };
  const nextHeroLevels = { ...heroLevels, [heroId]: currentLevel };
  
  GameManager.setState({
    heroXP: nextHeroXP,
    heroLevels: nextHeroLevels
  });
  return nextXP;
}

export function spendSkillPoint(scene) {
  const skillPoints = GameManager.get('skillPoints') || 0;
  if (skillPoints <= 0) return { success: false };

  const newSkillPoints = skillPoints - 1;
  GameManager.set('skillPoints', newSkillPoints);

  return { success: true, skillPoints: newSkillPoints };
}
