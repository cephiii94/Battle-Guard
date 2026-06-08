const SAVE_KEY = 'battle-guard-player-data';

export const defaultPlayerData = {
  gold: 230560,
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
  completedStages: []
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

export function saveStageProgress({ highestStage, completedStageId }) {
  const playerData = loadPlayerData();
  const completedStages = completedStageId
    ? uniqueIds([...playerData.completedStages, completedStageId])
    : playerData.completedStages;

  return savePlayerData({
    ...playerData,
    highestStage: Math.max(playerData.highestStage, highestStage || playerData.highestStage),
    completedStages
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
    highestStageUnlocked: playerData.highestStage,
    completedStages: [...playerData.completedStages]
  });
  registry.set('selectedHeroId', playerData.selectedHeroId);
  registry.set('selectedPetId', playerData.selectedPetId);
  registry.set('equipmentInventory', {
    items: [...playerData.ownedEquipment],
    equipped: { ...playerData.equippedItems }
  });
  registry.set('unlockedHeroes', [...playerData.unlockedHeroes]);
  registry.set('unlockedPets', [...playerData.unlockedPets]);
}

function normalizePlayerData(playerData) {
  const safeData = playerData || {};

  return {
    ...defaultPlayerData,
    ...safeData,
    gold: Number.isFinite(safeData.gold) ? safeData.gold : defaultPlayerData.gold,
    ownedEquipment: uniqueIds(safeData.ownedEquipment || defaultPlayerData.ownedEquipment),
    equippedItems: {
      ...defaultPlayerData.equippedItems,
      ...(safeData.equippedItems || {})
    },
    unlockedHeroes: uniqueIds(safeData.unlockedHeroes || defaultPlayerData.unlockedHeroes),
    unlockedPets: uniqueIds(safeData.unlockedPets || defaultPlayerData.unlockedPets),
    highestStage: Math.max(1, safeData.highestStage || defaultPlayerData.highestStage),
    completedStages: uniqueIds(safeData.completedStages || defaultPlayerData.completedStages)
  };
}

function uniqueIds(ids) {
  return [...new Set((ids || []).filter(Boolean))];
}

function isLocalStorageAvailable() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}
