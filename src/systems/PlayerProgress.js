import { saveStageProgress, updateGold, updateMaterials, updateTickets, updateDailyAttempts, savePlayerLevelAndExp } from '../services/saveService.js';

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
    const requiredExp = level * 500;
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
    progress.dailyAttempts = { date: new Date().toISOString().split('T')[0], survival: 3, gold: 3, boss: 3 };
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

export function unlockStage(scene, stageId, completedStageId = null) {
  const progress = getPlayerProgress(scene);
  const nextProgress = {
    ...progress,
    highestStageUnlocked: Math.max(progress.highestStageUnlocked, stageId)
  };

  scene.registry.set('playerProgress', nextProgress);
  saveStageProgress({ highestStage: nextProgress.highestStageUnlocked, completedStageId });
  return nextProgress.highestStageUnlocked;
}
