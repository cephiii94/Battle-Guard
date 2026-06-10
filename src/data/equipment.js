const equipment = [
  {
    id: 'wooden-sword',
    name: 'Wooden Sword',
    slot: 'weapon',
    icon: '/',
    bonus: {
      damage: 5
    }
  },
  {
    id: 'iron-sword',
    name: 'Iron Sword',
    slot: 'weapon',
    icon: '!',
    bonus: {
      damage: 12
    }
  },
  {
    id: 'cloth-armor',
    name: 'Cloth Armor',
    slot: 'armor',
    icon: 'V',
    bonus: {
      hp: 20,
      armor: 2,
      evasion: 0.02
    }
  },
  {
    id: 'iron-armor',
    name: 'Iron Armor',
    slot: 'armor',
    icon: 'A',
    bonus: {
      hp: 50,
      armor: 5
    }
  },
  {
    id: 'lucky-ring',
    name: 'Lucky Ring',
    slot: 'accessory',
    icon: 'O',
    bonus: {
      criticalChance: 0.05,
      cooldownReduction: 0.05,
      evasion: 0.03
    }
  },
  {
    id: 'dragon-slayer',
    name: 'Dragon Slayer',
    slot: 'weapon',
    icon: '⚔️',
    bonus: {
      damage: 30,
      criticalChance: 0.10
    }
  },
  {
    id: 'dragon-mail',
    name: 'Dragon Mail',
    slot: 'armor',
    icon: '🛡️',
    bonus: {
      hp: 150,
      armor: 12
    }
  },
  {
    id: 'magic-necklace',
    name: 'Magic Necklace',
    slot: 'accessory',
    icon: '📿',
    bonus: {
      cooldownReduction: 0.15,
      healthRegen: 5
    }
  }
];

export default equipment;
