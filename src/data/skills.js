const skills = [
  {
    id: 'fireball',
    name: 'Fireball',
    type: 'active',
    description: 'Menembakkan bola api ke enemy terdekat.',
    level: 0,
    maxLevel: 5,
    cooldown: 2200,
    damage: 28,
    range: 360,
    area: 0,
    assetKey: 'skill-fireball',
    assetPath: '/assets/skills/fireball.svg',
    requiredPlayerLevel: 1,
    dependsOn: null
  },
  {
    id: 'multi-shot',
    name: 'Multiple Attack',
    type: 'active',
    description: 'Melakukan serangan multi-target ke arah enemy terdekat.',
    level: 0,
    maxLevel: 5,
    cooldown: 2800,
    damage: 18,
    range: 330,
    area: 0,
    assetKey: 'skill-multi-shot',
    assetPath: '/assets/skills/multi-shot.svg',
    requiredPlayerLevel: 2,
    dependsOn: null
  },
  {
    id: 'lightning-strike',
    name: 'Lightning Strike',
    type: 'active',
    description: 'Petir instan menyerang enemy terdekat.',
    level: 0,
    maxLevel: 5,
    cooldown: 3400,
    damage: 42,
    range: 430,
    area: 70,
    assetKey: 'skill-lightning-strike',
    assetPath: '/assets/skills/lightning-strike.svg',
    requiredPlayerLevel: 3,
    dependsOn: 'fireball'
  },
  {
    id: 'spin-attack',
    name: 'Spin Attack',
    type: 'active',
    description: 'Serangan area di sekitar hero.',
    level: 0,
    maxLevel: 5,
    cooldown: 3000,
    damage: 24,
    range: 0,
    area: 145,
    assetKey: 'skill-spin-attack',
    assetPath: '/assets/skills/spin-attack.svg',
    requiredPlayerLevel: 4,
    dependsOn: 'multi-shot'
  },
  {
    id: 'magnet',
    name: 'Loot Magnet',
    type: 'passive',
    description: 'Meningkatkan jangkauan penarikan loot dan exp.',
    level: 0,
    maxLevel: 5,
    cooldown: 0,
    damage: 0,
    range: 150,
    area: 0,
    assetKey: 'skill-magnet',
    assetPath: '/assets/skills/magnet.svg',
    requiredPlayerLevel: 1,
    dependsOn: null
  },
  {
    id: 'movespeed',
    name: 'Swiftness',
    type: 'passive',
    description: 'Meningkatkan kecepatan pergerakan hero.',
    level: 0,
    maxLevel: 5,
    cooldown: 0,
    damage: 0,
    range: 0,
    area: 0,
    assetKey: 'skill-movespeed',
    assetPath: '/assets/skills/movespeed.svg',
    requiredPlayerLevel: 2,
    dependsOn: null
  },
  {
    id: 'aspd',
    name: 'Frenzy',
    type: 'passive',
    description: 'Meningkatkan kecepatan serangan hero (melee & ranged).',
    level: 0,
    maxLevel: 5,
    cooldown: 0,
    damage: 0,
    range: 0,
    area: 0,
    assetKey: 'skill-aspd',
    assetPath: '/assets/skills/aspd.svg',
    requiredPlayerLevel: 3,
    dependsOn: null
  },
  {
    id: 'hp-regen',
    name: 'Vitality',
    type: 'passive',
    description: 'Meningkatkan regen HP hero per detik.',
    level: 0,
    maxLevel: 5,
    cooldown: 0,
    damage: 0,
    range: 0,
    area: 0,
    assetKey: 'skill-regen',
    assetPath: '/assets/skills/regen.svg',
    requiredPlayerLevel: 3,
    dependsOn: 'movespeed'
  },
  {
    id: 'shield',
    name: 'Aegis Shield',
    type: 'passive',
    description: 'Mendapatkan shield yang menyerap damage dan meregenerasi.',
    level: 0,
    maxLevel: 5,
    cooldown: 0,
    damage: 0,
    range: 0,
    area: 0,
    assetKey: 'skill-shield',
    assetPath: '/assets/skills/shield.svg',
    requiredPlayerLevel: 5,
    dependsOn: 'hp-regen'
  },
  {
    id: 'attack-range',
    name: 'Eagle Eye',
    type: 'passive',
    description: 'Meningkatkan jarak serangan dasar projectile hero (Khusus Ranged).',
    level: 0,
    maxLevel: 5,
    cooldown: 0,
    damage: 0,
    range: 0,
    area: 0,
    assetKey: 'skill-range',
    assetPath: '/assets/skills/range.svg',
    requiredPlayerLevel: 4,
    dependsOn: 'aspd'
  },
  {
    id: 'knock',
    name: 'Heavy Impact',
    type: 'passive',
    description: 'Serangan dasar hero memberikan efek knockback (mendorong mundur) enemy.',
    level: 0,
    maxLevel: 5,
    cooldown: 0,
    damage: 0,
    range: 0,
    area: 0,
    assetKey: 'skill-knock',
    assetPath: '/assets/skills/knock.svg',
    requiredPlayerLevel: 4,
    dependsOn: 'aspd'
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
  if (skill.type === 'passive') {
    switch (skill.id) {
      case 'magnet':
        return { range: 150 + (skill.level * 20) }; // +20px per lvl
      case 'movespeed':
        return { speed: skill.level * 0.04 }; // +4% per lvl
      case 'aspd':
        return { aspd: skill.level * 0.05 }; // +5% per lvl
      case 'hp-regen':
        return { regen: skill.level * 0.5 }; // +0.5 HP/s per lvl
      case 'shield':
        return { shield: skill.level * 10 }; // +10 Shield capacity per lvl
      case 'attack-range':
        return { range: skill.level * 0.05 }; // +5% per lvl
      case 'knock':
        return { chance: skill.level * 0.10 }; // +10% knockback chance per lvl
      default:
        return {};
    }
  }

  const levelBonus = Math.max(0, skill.level - 1);

  return {
    cooldown: Math.max(550, skill.cooldown - (levelBonus * 60)),
    damage: Math.round(skill.damage * (1 + (levelBonus * 0.12))),
    range: skill.range + (levelBonus * 8),
    area: skill.area + (levelBonus * 6)
  };
}

export default skills;
