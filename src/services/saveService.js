import { saveToFirestore, resetInFirestore, isFirebaseConfigured } from './firebase.js';

const SAVE_KEY = 'battle-guard-player-data';

export const defaultPlayerData = {
  playerName: null,
  gold: 230560,
  playerLevel: 1,
  playerExp: 0,
  unlockedSkillLevel: 1,
  selectedHeroId: 'guardian',
  selectedPetId: null,
  // === RPG CLASS SYSTEM ===
  // Possible values: 'Novice', 'Swordsman', 'Archer', 'Mage', 'Knight', 'Hunter', 'Wizard'
  currentClass: 'Novice',
  // Points awarded on level up (5 status points + 1 skill point per level)
  statusPoints: 0,
  skillPoints: 0,
  allocatedStats: {
    strength: 0,  // +1.5 Damage per point
    agility: 0,   // +1.5% Attack Speed, +1% Move Speed per point
    intelligence: 0,  // +1 Armor, +1% CD Reduc, +0.5% Lifesteal per point
  },
  // === END RPG CLASS SYSTEM ===
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
  heroXP: {
    guardian: 0,
    ranger: 0,
    mage: 0,
    antman: 0
  },
  skillLevels: {
    'fireball': 1,
    'multi-shot': 0,
    'lightning-strike': 0,
    'spin-attack': 0,
    'magnet': 0,
    'movespeed': 0,
    'aspd': 0,
    'hp-regen': 0,
    'shield': 0,
    'attack-range': 0
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
  },
  lastSavedTime: 0
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
  const dataWithTime = {
    ...playerData,
    lastSavedTime: Date.now()
  };
  const normalizedData = normalizePlayerData(dataWithTime);
  storageAdapter.save(normalizedData);
  return normalizedData;
}

export function resetSaveData() {
  storageAdapter.reset();
  return savePlayerData(defaultPlayerData);
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
    unlockedSkillLevel: Number.isFinite(safeData.unlockedSkillLevel) ? safeData.unlockedSkillLevel : defaultPlayerData.unlockedSkillLevel,
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
    heroXP: safeData.heroXP || { ...defaultPlayerData.heroXP },
    skillLevels: safeData.skillLevels || { ...defaultPlayerData.skillLevels },
    materials: {
      ...defaultPlayerData.materials,
      ...(safeData.materials || {})
    },
    tickets: {
      ...defaultPlayerData.tickets,
      ...(safeData.tickets || {})
    },
    dailyAttempts,
    // RPG Class System normalization
    currentClass: safeData.currentClass || defaultPlayerData.currentClass,
    statusPoints: Number.isFinite(safeData.statusPoints) ? safeData.statusPoints : 0,
    skillPoints: Number.isFinite(safeData.skillPoints) ? safeData.skillPoints : 0,
    allocatedStats: {
      ...defaultPlayerData.allocatedStats,
      ...(safeData.allocatedStats || {})
    },
    // Idle Offline Reward timestamp
    lastSavedTime: Number.isFinite(safeData.lastSavedTime) ? safeData.lastSavedTime : 0,
  };
}

function uniqueIds(ids) {
  return [...new Set((ids || []).filter(Boolean))];
}

function isLocalStorageAvailable() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}
