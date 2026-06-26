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
  },
  // --- BOW RECIPES ---
  {
    resultItemId: 'wooden-bow',
    name: 'Wooden Bow',
    costGold: 200,
    materials: {
      'iron-ore': 2
    }
  },
  {
    resultItemId: 'composite-bow',
    name: 'Composite Bow',
    costGold: 1000,
    materials: {
      'iron-ore': 6,
      'magic-gem': 2
    }
  },
  {
    resultItemId: 'phantom-bow',
    name: 'Phantom Bow',
    costGold: 3500,
    materials: {
      'iron-ore': 12,
      'magic-gem': 6,
      'dragon-scale': 3
    }
  },
  // --- STAFF RECIPES ---
  {
    resultItemId: 'apprentice-staff',
    name: 'Apprentice Staff',
    costGold: 250,
    materials: {
      'magic-gem': 1
    }
  },
  {
    resultItemId: 'scholar-staff',
    name: 'Scholar Staff',
    costGold: 1200,
    materials: {
      'iron-ore': 4,
      'magic-gem': 4
    }
  },
  {
    resultItemId: 'archmage-staff',
    name: 'Archmage Staff',
    costGold: 3800,
    materials: {
      'iron-ore': 10,
      'magic-gem': 8,
      'dragon-scale': 3
    }
  }
];

export default craftingRecipes;
