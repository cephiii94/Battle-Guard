import { saveStageProgress, updateGold, updateMaterials, updateTickets, updateDailyAttempts, savePlayerLevelAndExp, savePlayerProgress, saveHeroLevelAndXP } from '../services/saveService.js';

const DEFAULT_PROGRESS = {
  gold: 230560,
  highestStageUnlocked: 1,
  materials: {
    'iron-ore': 0,
    'magic-gem': 0,
    'dragon-scale': 0
  },
  tickets: {
    'survival-ticket': 5,
    'gold-ticket': 5,
    'boss-ticket': 5
  },
  dailyAttempts: {
    date: '',
    survival: 3,
    gold: 3,
    boss: 3
  }
};

export function getPlayerProgress(scene) {
  const savedProgress = scene.registry.get('playerProgress');

  if (savedProgress) {
    return savedProgress;
  }

  const progress = { ...DEFAULT_PROGRESS };
  scene.registry.set('playerProgress', progress);
  return progress;
}

export function addPlayerGold(scene, amount) {
  const progress = getPlayerProgress(scene);
  const nextProgress = {
    ...progress,
    gold: progress.gold + amount
  };

  scene.registry.set('playerProgress', nextProgress);
  updateGold(nextProgress.gold);
  return nextProgress.gold;
}

export function addPlayerExp(scene, amount) {
  const progress = getPlayerProgress(scene);
  let level = progress.playerLevel || 1;
  let exp = (progress.playerExp || 0) + amount;
  let leveledUp = false;

  while (true) {
    const requiredExp = level * 200;
    if (exp >= requiredExp) {
      exp -= requiredExp;
      level += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  const nextProgress = {
    ...progress,
    playerLevel: level,
    playerExp: exp
  };

  scene.registry.set('playerProgress', nextProgress);
  savePlayerLevelAndExp(level, exp);

  // Sync with registry playerData
  const playerData = scene.registry.get('playerData') || {};
  playerData.playerLevel = level;
  playerData.playerExp = exp;
  scene.registry.set('playerData', playerData);

  return {
    level,
    exp,
    leveledUp
  };
}

export function addPlayerMaterial(scene, materialId, amount) {
  const progress = getPlayerProgress(scene);
  const materials = {
    ...progress.materials,
    [materialId]: Math.max(0, (progress.materials[materialId] || 0) + amount)
  };
  const nextProgress = {
    ...progress,
    materials
  };

  scene.registry.set('playerProgress', nextProgress);
  updateMaterials(materials);
  return nextProgress;
}

export function addPlayerTicket(scene, ticketId, amount) {
  const progress = getPlayerProgress(scene);
  const tickets = {
    ...progress.tickets,
    [ticketId]: Math.max(0, (progress.tickets[ticketId] || 0) + amount)
  };
  const nextProgress = {
    ...progress,
    tickets
  };

  scene.registry.set('playerProgress', nextProgress);
  updateTickets(tickets);
  return nextProgress;
}

export function getDailyAttemptsRemaining(scene, mode) {
  const progress = getPlayerProgress(scene);
  // Mode mapping:
  // 'survival' -> 'survival'
  // 'gold_farm' -> 'gold'
  // 'looting' -> 'boss'
  const key = mode === 'gold_farm' ? 'gold' : (mode === 'looting' ? 'boss' : 'survival');
  return progress.dailyAttempts[key] !== undefined ? progress.dailyAttempts[key] : 3;
}

export function consumeDailyAttempt(scene, mode) {
  const progress = getPlayerProgress(scene);
  const key = mode === 'gold_farm' ? 'gold' : (mode === 'looting' ? 'boss' : 'survival');
  
  if (!progress.dailyAttempts) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    progress.dailyAttempts = { date: currentDate, survival: 3, gold: 3, boss: 3 };
  }
  
  const currentAttempts = progress.dailyAttempts[key] !== undefined ? progress.dailyAttempts[key] : 3;
  if (currentAttempts > 0) {
    const dailyAttempts = {
      ...progress.dailyAttempts,
      [key]: currentAttempts - 1
    };
    const nextProgress = {
      ...progress,
      dailyAttempts
    };
    scene.registry.set('playerProgress', nextProgress);
    updateDailyAttempts(dailyAttempts);
    return true;
  }
  return false;
}

export function hasTicket(scene, ticketId) {
  const progress = getPlayerProgress(scene);
  return (progress.tickets && progress.tickets[ticketId] > 0);
}

export function consumeTicket(scene, ticketId) {
  const progress = getPlayerProgress(scene);
  if (hasTicket(scene, ticketId)) {
    const tickets = {
      ...progress.tickets,
      [ticketId]: progress.tickets[ticketId] - 1
    };
    const nextProgress = {
      ...progress,
      tickets
    };
    scene.registry.set('playerProgress', nextProgress);
    updateTickets(tickets);
    return true;
  }
  return false;
}

export function unlockStage(scene, stageId, completedStageId = null, clearTime = null) {
  const progress = getPlayerProgress(scene);
  const stageTimes = { ...(progress.stageTimes || {}) };

  if (completedStageId !== null && clearTime !== null) {
    const existingTime = stageTimes[completedStageId];
    if (existingTime === undefined || clearTime < existingTime) {
      stageTimes[completedStageId] = clearTime;
    }
  }

  const nextProgress = {
    ...progress,
    highestStageUnlocked: Math.max(progress.highestStageUnlocked, stageId),
    stageTimes
  };

  scene.registry.set('playerProgress', nextProgress);
  saveStageProgress({ highestStage: nextProgress.highestStageUnlocked, completedStageId, stageTimes });
  return nextProgress.highestStageUnlocked;
}

export function getSkillLevelsForPlayerLevel(roadLevel) {
  const skillsList = [
    'fireball',
    'multi-shot',
    'lightning-strike',
    'spin-attack',
    'magnet',
    'movespeed',
    'aspd',
    'hp-regen',
    'shield',
    'attack-range',
    'knock'
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
  const heroLevels = scene.registry.get('heroLevels') || {};
  const heroXP = scene.registry.get('heroXP') || {};

  const currentLevel = heroLevels[heroId] || 1;
  const currentXP = heroXP[heroId] || 0;
  const requiredXP = currentLevel * 100;

  // Cap at required XP (so they must level up to gain more)
  const nextXP = Math.min(requiredXP, currentXP + amount);

  heroXP[heroId] = nextXP;
  scene.registry.set('heroXP', heroXP);

  // Sync registry playerData
  const playerData = scene.registry.get('playerData') || {};
  if (!playerData.heroLevels) playerData.heroLevels = {};
  if (!playerData.heroXP) playerData.heroXP = {};
  playerData.heroLevels[heroId] = currentLevel;
  playerData.heroXP[heroId] = nextXP;
  scene.registry.set('playerData', playerData);

  saveHeroLevelAndXP(heroId, currentLevel, nextXP);

  return nextXP;
}

