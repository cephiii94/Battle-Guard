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
      hp: 20
    }
  },
  {
    id: 'iron-armor',
    name: 'Iron Armor',
    slot: 'armor',
    icon: 'A',
    bonus: {
      hp: 50
    }
  },
  {
    id: 'lucky-ring',
    name: 'Lucky Ring',
    slot: 'accessory',
    icon: 'O',
    bonus: {
      criticalChance: 0.05
    }
  }
];

export default equipment;
