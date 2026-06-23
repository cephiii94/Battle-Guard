const bosses = [
  {
    id: 'forest-guardian',
    name: 'Forest Guardian Boss',
    hp: 650,
    damage: 34,
    moveSpeed: 82,
    attackCooldown: 1800,
    attackRange: 92,
    slamArea: 135,
    goldReward: 350,
    equipmentDropChance: 0.35
  }
];

export function getBossForStage(stage) {
  if (stage && stage.bossId) {
    const boss = bosses.find(b => b.id === stage.bossId);
    if (boss) return boss;
  }
  return bosses[0];
}

export default bosses;
