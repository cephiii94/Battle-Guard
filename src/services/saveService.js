import { saveToFirestore, resetInFirestore, isFirebaseConfigured } from './firebase.js';

const SAVE_KEY = 'battle-guard-player-data';

export const defaultPlayerData = {
  gold: 230560,
  playerLevel: 1,
  playerExp: 0,
  selectedHeroId: 'guardian',
  selectedPetId: null,
  ownedEquipment: [
    'wooden-sword',
    'iron-sword',
    'cloth-armor',
    'iron-armor',
    'lucky-ring'
  ],
  equippedItems: {
    weapon: null,
    armor: null,
    accessory: null
  },
  unlockedHeroes: ['guardian', 'ranger', 'mage'],
  unlockedPets: [],
  highestStage: 1,
  completedStages: [],
  heroLevels: {
    guardian: 1,
    ranger: 1,
    mage: 1,
    antman: 1
  },
  skillLevels: {
    'fireball': 1,
    'multi-shot': 0,
    'lightning-strike': 0,
    'spin-attack': 0
  },
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

const localStorageAdapter = {
  load() {
    if (!isLocalStorageAvailable()) {
      return null;
    }

    const rawData = window.localStorage.getItem(SAVE_KEY);

    if (!rawData) {
      return null;
    }

    try {
      return JSON.parse(rawData);
    } catch {
      return null;
    }
  },

  save(playerData) {
    if (!isLocalStorageAvailable()) {
      return playerData;
    }

    window.localStorage.setItem(SAVE_KEY, JSON.stringify(playerData));
    return playerData;
  },

  reset() {
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(SAVE_KEY);
    }
  }
};

export const firebaseAdapter = {
  load() {
    return localStorageAdapter.load();
  },

  save(playerData) {
    localStorageAdapter.save(playerData);
    if (isFirebaseConfigured) {
      saveToFirestore(playerData).catch(err => {
        console.error('Failed to sync save to Firestore:', err);
      });
    }
    return playerData;
  },

  reset() {
    localStorageAdapter.reset();
    if (isFirebaseConfigured) {
      resetInFirestore().catch(err => {
        console.error('Failed to reset Firestore save:', err);
      });
    }
  }
};

let storageAdapter = localStorageAdapter;

export function setSaveStorageAdapter(adapter) {
  storageAdapter = adapter || localStorageAdapter;
}

export function loadPlayerData() {
  return normalizePlayerData(storageAdapter.load());
}

export function savePlayerData(playerData) {
  const normalizedData = normalizePlayerData(playerData);
  storageAdapter.save(normalizedData);
  return normalizedData;
}

export function updateGold(gold) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    gold: Math.max(0, Math.round(gold))
  });
}

export function updateMaterials(materials) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    materials: {
      ...playerData.materials,
      ...materials
    }
  });
}

export function updateTickets(tickets) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    tickets: {
      ...playerData.tickets,
      ...tickets
    }
  });
}

export function updateDailyAttempts(dailyAttempts) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    dailyAttempts: {
      ...playerData.dailyAttempts,
      ...dailyAttempts
    }
  });
}

export function saveSelectedHero(heroId) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    selectedHeroId: heroId,
    unlockedHeroes: uniqueIds([...playerData.unlockedHeroes, heroId])
  });
}

export function saveSelectedPet(petId) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    selectedPetId: petId,
    unlockedPets: petId ? uniqueIds([...playerData.unlockedPets, petId]) : playerData.unlockedPets
  });
}

export function saveEquipment({ ownedEquipment, equippedItems }) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    ownedEquipment: uniqueIds(ownedEquipment || playerData.ownedEquipment),
    equippedItems: {
      ...defaultPlayerData.equippedItems,
      ...playerData.equippedItems,
      ...(equippedItems || {})
    }
  });
}

export function saveStageProgress({ highestStage, completedStageId, stageTimes }) {
  const playerData = loadPlayerData();
  const completedStages = completedStageId
    ? uniqueIds([...playerData.completedStages, completedStageId])
    : playerData.completedStages;

  return savePlayerData({
    ...playerData,
    highestStage: Math.max(playerData.highestStage, highestStage || playerData.highestStage),
    completedStages,
    stageTimes: stageTimes || playerData.stageTimes || {}
  });
}

export function saveHeroLevel(heroId, level) {
  const playerData = loadPlayerData();
  const nextHeroLevels = {
    ...(playerData.heroLevels || {}),
    [heroId]: level
  };
  return savePlayerData({
    ...playerData,
    heroLevels: nextHeroLevels
  });
}

export function saveSkillLevel(skillId, level) {
  const playerData = loadPlayerData();
  const nextSkillLevels = {
    ...(playerData.skillLevels || {}),
    [skillId]: level
  };
  return savePlayerData({
    ...playerData,
    skillLevels: nextSkillLevels
  });
}

export function savePlayerLevelAndExp(level, exp) {
  const playerData = loadPlayerData();
  return savePlayerData({
    ...playerData,
    playerLevel: level,
    playerExp: exp
  });
}

export function resetSaveData() {
  storageAdapter.reset();
  return savePlayerData(defaultPlayerData);
}

export function applyPlayerDataToRegistry(registry, playerData = loadPlayerData()) {
  registry.set('playerData', playerData);
  registry.set('playerProgress', {
    gold: playerData.gold,
    playerLevel: playerData.playerLevel || 1,
    playerExp: playerData.playerExp || 0,
    highestStageUnlocked: playerData.highestStage,
    completedStages: [...playerData.completedStages],
    materials: { ...playerData.materials },
    tickets: { ...playerData.tickets },
    dailyAttempts: { ...playerData.dailyAttempts },
    stageTimes: { ...(playerData.stageTimes || {}) }
  });
  registry.set('selectedHeroId', playerData.selectedHeroId);
  registry.set('selectedPetId', playerData.selectedPetId);
  registry.set('equipmentInventory', {
    items: [...playerData.ownedEquipment],
    equipped: { ...playerData.equippedItems }
  });
  registry.set('unlockedHeroes', [...playerData.unlockedHeroes]);
  registry.set('unlockedPets', [...playerData.unlockedPets]);
  registry.set('heroLevels', { ...playerData.heroLevels });
}

function normalizePlayerData(playerData) {
  const safeData = playerData || {};
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  let dailyAttempts = {
    ...defaultPlayerData.dailyAttempts,
    ...(safeData.dailyAttempts || {})
  };

  if (dailyAttempts.date !== currentDate) {
    dailyAttempts = {
      date: currentDate,
      survival: 3,
      gold: 3,
      boss: 3
    };
  }

  return {
    ...defaultPlayerData,
    ...safeData,
    gold: Number.isFinite(safeData.gold) ? safeData.gold : defaultPlayerData.gold,
    playerLevel: Number.isFinite(safeData.playerLevel) ? safeData.playerLevel : defaultPlayerData.playerLevel,
    playerExp: Number.isFinite(safeData.playerExp) ? safeData.playerExp : defaultPlayerData.playerExp,
    ownedEquipment: uniqueIds(safeData.ownedEquipment || defaultPlayerData.ownedEquipment),
    equippedItems: {
      ...defaultPlayerData.equippedItems,
      ...(safeData.equippedItems || {})
    },
    unlockedHeroes: uniqueIds(safeData.unlockedHeroes || defaultPlayerData.unlockedHeroes),
    unlockedPets: uniqueIds(safeData.unlockedPets || defaultPlayerData.unlockedPets),
    highestStage: Math.max(1, safeData.highestStage || defaultPlayerData.highestStage),
    completedStages: uniqueIds(safeData.completedStages || defaultPlayerData.completedStages),
    stageTimes: safeData.stageTimes || {},
    heroLevels: safeData.heroLevels || { ...defaultPlayerData.heroLevels },
    skillLevels: safeData.skillLevels || { ...defaultPlayerData.skillLevels },
    materials: {
      ...defaultPlayerData.materials,
      ...(safeData.materials || {})
    },
    tickets: {
      ...defaultPlayerData.tickets,
      ...(safeData.tickets || {})
    },
    dailyAttempts
  };
}

function uniqueIds(ids) {
  return [...new Set((ids || []).filter(Boolean))];
}

function isLocalStorageAvailable() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}
