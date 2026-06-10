const skins = [
  {
    id: 'default-guard',
    name: 'Default Guard',
    description: 'No bonus',
    colors: {
      hero: 0x2f6dff,
      border: 0xbfdbfe,
      aura: 0x60a5fa
    },
    getScalingBonus: () => ({})
  },
  {
    id: 'crimson-shadow',
    name: 'Crimson Shadow',
    description: 'Attack Range +10% per player level x 0.5',
    colors: {
      hero: 0x160b0b,
      border: 0xdc2626,
      aura: 0x7f1d1d
    },
    getScalingBonus: (level, baseStats) => ({
      attackRange: baseStats.attackRange * 0.1 * level * 0.5
    })
  },
  {
    id: 'azure-knight',
    name: 'Azure Knight',
    description: 'Max HP +8% per player level x 0.5',
    colors: {
      hero: 0x2563eb,
      border: 0xe5e7eb,
      aura: 0x7dd3fc
    },
    getScalingBonus: (level, baseStats) => ({
      hp: baseStats.hp * 0.08 * level * 0.5
    })
  },
  {
    id: 'golden-ranger',
    name: 'Golden Ranger',
    description: 'Damage +6% per player level x 0.5',
    colors: {
      hero: 0xfacc15,
      border: 0xffffff,
      aura: 0xfde047
    },
    getScalingBonus: (level, baseStats) => ({
      damage: baseStats.damage * 0.06 * level * 0.5
    })
  },
  {
    id: 'antman-skin',
    name: 'Ant-Man Suit',
    description: 'Nano dynamic: Area +20%, Speed +15%',
    assetKey: 'skin-antman',
    assetPath: '/assets/heroes/antman.png',
    colors: {
      hero: 0x991b1b,
      border: 0xef4444,
      aura: 0xef4444
    },
    getScalingBonus: (level, baseStats) => ({
      moveSpeed: baseStats.moveSpeed * 0.15,
      attackRange: baseStats.attackRange * 0.20
    })
  }
];

export default skins;
