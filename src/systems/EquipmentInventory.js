import equipment from '../data/equipment.js';
import { saveEquipment } from '../services/saveService.js';

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory'];

const DEFAULT_INVENTORY = {
  items: equipment.map((item) => item.id),
  equipped: {
    weapon: null,
    armor: null,
    accessory: null
  }
};

export function getEquipmentInventory(scene) {
  const savedInventory = scene.registry.get('equipmentInventory');

  if (savedInventory) {
    const inventory = normalizeInventory(savedInventory);
    scene.registry.set('equipmentInventory', inventory);
    return inventory;
  }

  const inventory = cloneDefaultInventory();
  scene.registry.set('equipmentInventory', inventory);
  return inventory;
}

export function getInventoryItems(scene) {
  const inventory = getEquipmentInventory(scene);
  return inventory.items
    .map((itemId) => getEquipmentById(itemId))
    .filter(Boolean);
}

export function getEquippedItems(scene) {
  const inventory = getEquipmentInventory(scene);
  return EQUIPMENT_SLOTS
    .map((slot) => getEquipmentById(inventory.equipped[slot]))
    .filter(Boolean);
}

export function getEquippedItemBySlot(scene, slot) {
  const inventory = getEquipmentInventory(scene);
  return getEquipmentById(inventory.equipped[slot]);
}

export function equipItem(scene, itemId) {
  const item = getEquipmentById(itemId);

  if (!item) {
    return getEquipmentInventory(scene);
  }

  const inventory = getEquipmentInventory(scene);

  if (!inventory.items.includes(itemId)) {
    inventory.items.push(itemId);
  }

  const nextInventory = {
    ...inventory,
    equipped: {
      ...inventory.equipped,
      [item.slot]: item.id
    }
  };

  scene.registry.set('equipmentInventory', nextInventory);
  persistEquipment(nextInventory);
  return nextInventory;
}

export function addEquipmentToInventory(scene, itemId) {
  const item = getEquipmentById(itemId);

  if (!item) {
    return getEquipmentInventory(scene);
  }

  const inventory = getEquipmentInventory(scene);

  if (inventory.items.includes(itemId)) {
    return inventory;
  }

  const nextInventory = {
    ...inventory,
    items: [...inventory.items, itemId]
  };

  scene.registry.set('equipmentInventory', nextInventory);
  persistEquipment(nextInventory);
  return nextInventory;
}

export function unequipSlot(scene, slot) {
  const inventory = getEquipmentInventory(scene);

  if (!EQUIPMENT_SLOTS.includes(slot)) {
    return inventory;
  }

  const nextInventory = {
    ...inventory,
    equipped: {
      ...inventory.equipped,
      [slot]: null
    }
  };

  scene.registry.set('equipmentInventory', nextInventory);
  persistEquipment(nextInventory);
  return nextInventory;
}

export function getEquipmentById(itemId) {
  return equipment.find((item) => item.id === itemId) || null;
}

export function formatEquipmentBonus(item) {
  return Object.entries(item.bonus)
    .map(([statName, value]) => `${getStatLabel(statName)} ${formatSignedValue(statName, value)}`)
    .join(', ');
}

export function getStatLabel(statName) {
  const labels = {
    hp: 'HP',
    damage: 'Attack',
    attackSpeed: 'Attack Speed',
    moveSpeed: 'Move Speed',
    criticalChance: 'Crit Chance',
    healthRegen: 'HP Regen',
    armor: 'Armor',
    lifesteal: 'Lifesteal',
    evasion: 'Evasion',
    cooldownReduction: 'CDR'
  };

  return labels[statName] || statName;
}

function formatSignedValue(statName, value) {
  if (statName === 'criticalChance' || statName === 'lifesteal' || statName === 'evasion' || statName === 'cooldownReduction') {
    return `+${Math.round(value * 100)}%`;
  }
  if (statName === 'healthRegen') {
    return `+${value}/s`;
  }

  return `+${value}`;
}

function cloneDefaultInventory() {
  return {
    items: [...DEFAULT_INVENTORY.items],
    equipped: { ...DEFAULT_INVENTORY.equipped }
  };
}

function normalizeInventory(inventory) {
  const savedItems = Array.isArray(inventory.items) ? inventory.items : [];

  const nextInventory = {
    items: [...new Set([...savedItems, ...DEFAULT_INVENTORY.items])],
    equipped: {
      ...DEFAULT_INVENTORY.equipped,
      ...(inventory.equipped || {})
    }
  };

  return nextInventory;
}

function persistEquipment(inventory) {
  saveEquipment({
    ownedEquipment: inventory.items,
    equippedItems: inventory.equipped
  });
}
