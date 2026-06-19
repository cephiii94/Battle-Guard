import equipment from '../data/equipment.js';
import { GameManager } from './GameManager.js';

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory'];

export function getEquipmentInventory(scene) {
  const ownedEquipment = GameManager.get('ownedEquipment') || [];
  const equippedItems = GameManager.get('equippedItems') || { weapon: null, armor: null, accessory: null };
  return { items: ownedEquipment, equipped: equippedItems };
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

function persistEquipment(inventory) {
  GameManager.setState({
    ownedEquipment: inventory.items,
    equippedItems: inventory.equipped
  });
}
