const craftingRecipes = [
  {
    resultItemId: 'iron-sword',
    name: 'Iron Sword',
    costGold: 500,
    materials: {
      'iron-ore': 5
    }
  },
  {
    resultItemId: 'iron-armor',
    name: 'Iron Armor',
    costGold: 800,
    materials: {
      'iron-ore': 8
    }
  },
  {
    resultItemId: 'lucky-ring',
    name: 'Lucky Ring',
    costGold: 1200,
    materials: {
      'magic-gem': 3
    }
  },
  {
    resultItemId: 'dragon-slayer',
    name: 'Dragon Slayer',
    costGold: 3000,
    materials: {
      'iron-ore': 15,
      'magic-gem': 5,
      'dragon-scale': 2
    }
  },
  {
    resultItemId: 'dragon-mail',
    name: 'Dragon Mail',
    costGold: 4000,
    materials: {
      'iron-ore': 10,
      'magic-gem': 5,
      'dragon-scale': 4
    }
  },
  {
    resultItemId: 'magic-necklace',
    name: 'Magic Necklace',
    costGold: 2500,
    materials: {
      'magic-gem': 10,
      'dragon-scale': 1
    }
  }
];

export default craftingRecipes;
