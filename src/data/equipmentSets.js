const equipmentSets = [
  {
    id: 'adventurer',
    name: 'Adventurer Set',
    items: ['wooden-sword', 'cloth-armor', 'lucky-ring'],
    bonuses: {
      2: { hp: 20 },
      3: { evasion: 0.05, criticalChance: 0.03 }
    }
  },
  {
    id: 'iron',
    name: 'Iron Set',
    items: ['iron-sword', 'iron-armor'],
    bonuses: {
      2: { armor: 3, damage: 5 }
    }
  },
  {
    id: 'dragon',
    name: 'Dragon Set',
    items: ['dragon-slayer', 'dragon-mail'],
    bonuses: {
      2: { damage: 15, hp: 50, criticalChance: 0.05 }
    }
  }
];

export default equipmentSets;
