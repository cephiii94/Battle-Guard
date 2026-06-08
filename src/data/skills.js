const skills = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Menembakkan bola api ke enemy terdekat.',
    level: 0,
    maxLevel: 5,
    cooldown: 2200,
    damage: 28,
    range: 360,
    area: 0,
    assetKey: 'skill-fireball',
    assetPath: '/assets/skills/fireball.svg'
  },
  {
    id: 'multi-shot',
    name: 'Multi Shot',
    description: 'Menembakkan beberapa projectile ke target terdekat.',
    level: 0,
    maxLevel: 5,
    cooldown: 2800,
    damage: 18,
    range: 330,
    area: 0,
    assetKey: 'skill-multi-shot',
    assetPath: '/assets/skills/multi-shot.svg'
  },
  {
    id: 'lightning-strike',
    name: 'Lightning Strike',
    description: 'Petir instan menyerang enemy terdekat.',
    level: 0,
    maxLevel: 5,
    cooldown: 3400,
    damage: 42,
    range: 430,
    area: 70,
    assetKey: 'skill-lightning-strike',
    assetPath: '/assets/skills/lightning-strike.svg'
  },
  {
    id: 'spin-attack',
    name: 'Spin Attack',
    description: 'Serangan area di sekitar hero.',
    level: 0,
    maxLevel: 5,
    cooldown: 3000,
    damage: 24,
    range: 0,
    area: 145,
    assetKey: 'skill-spin-attack',
    assetPath: '/assets/skills/spin-attack.svg'
  }
];

export function getSkillById(skillId) {
  return skills.find((skill) => skill.id === skillId) || null;
}

export function createSkillState(skill) {
  return {
    ...skill,
    level: 1,
    cooldownRemaining: 0
  };
}

export function getSkillLevelStats(skill) {
  const levelBonus = Math.max(0, skill.level - 1);

  return {
    cooldown: Math.max(550, skill.cooldown - (levelBonus * 120)),
    damage: Math.round(skill.damage * (1 + (levelBonus * 0.28))),
    range: skill.range + (levelBonus * 18),
    area: skill.area + (levelBonus * 14)
  };
}

export default skills;
