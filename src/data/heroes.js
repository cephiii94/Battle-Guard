const heroes = [
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'HP tinggi, attack sedang.',
    baseHp: 160,
    baseAttack: 12,
    attackSpeed: 1,
    attackRange: 240,
    moveSpeed: 185,
    passiveBonus: {
      hp: 20
    },
    cosmeticSkinId: 'default-guard',
    assetKey: 'hero-guardian',
    assetPath: '/assets/heroes/guardian.svg'
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Attack speed tinggi, range lebih jauh.',
    baseHp: 105,
    baseAttack: 10,
    attackSpeed: 1.35,
    attackRange: 330,
    moveSpeed: 220,
    passiveBonus: {
      criticalChance: 0.03
    },
    cosmeticSkinId: 'golden-ranger',
    assetKey: 'hero-ranger',
    assetPath: '/assets/heroes/ranger.svg'
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Attack tinggi, HP rendah.',
    baseHp: 80,
    baseAttack: 22,
    attackSpeed: 0.9,
    attackRange: 285,
    moveSpeed: 200,
    passiveBonus: {
      damage: 4
    },
    cosmeticSkinId: 'crimson-shadow',
    assetKey: 'hero-mage',
    assetPath: '/assets/heroes/mage.svg'
  }
];

export function getHeroById(heroId) {
  return heroes.find((hero) => hero.id === heroId) || heroes[0];
}

export function getHeroBaseStats(hero) {
  const baseStats = {
    hp: hero.baseHp,
    damage: hero.baseAttack,
    moveSpeed: hero.moveSpeed,
    attackSpeed: hero.attackSpeed,
    attackRange: hero.attackRange,
    criticalChance: 0
  };

  Object.entries(hero.passiveBonus || {}).forEach(([statName, value]) => {
    baseStats[statName] += value;
  });

  return baseStats;
}

export default heroes;
