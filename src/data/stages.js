const stages = [
  {
    stageId: 1,
    stageName: 'Stage 1',
    duration: 60,
    enemySpawnRate: 1800,
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    goldReward: 100,
    bossCount: 1,
    bossInterval: 60
  },
  {
    stageId: 2,
    stageName: 'Stage 2',
    duration: 80,
    enemySpawnRate: 1500,
    enemyHpMultiplier: 1.25,
    enemyDamageMultiplier: 1.15,
    goldReward: 150,
    bossCount: 1,
    bossInterval: 80
  },
  {
    stageId: 3,
    stageName: 'Stage 3',
    duration: 120,
    enemySpawnRate: 1250,
    enemyHpMultiplier: 1.55,
    enemyDamageMultiplier: 1.3,
    goldReward: 225,
    bossCount: 2,
    bossInterval: 60
  },
  {
    stageId: 4,
    stageName: 'Stage 4',
    duration: 160,
    enemySpawnRate: 1100,
    enemyHpMultiplier: 1.8,
    enemyDamageMultiplier: 1.45,
    goldReward: 300,
    bossCount: 2,
    bossInterval: 80
  },
  {
    stageId: 5,
    stageName: 'Stage 5',
    duration: 180,
    enemySpawnRate: 950,
    enemyHpMultiplier: 2.1,
    enemyDamageMultiplier: 1.6,
    goldReward: 375,
    bossCount: 3,
    bossInterval: 60
  },
  {
    stageId: 6,
    stageName: 'Stage 6',
    duration: 240,
    enemySpawnRate: 800,
    enemyHpMultiplier: 2.4,
    enemyDamageMultiplier: 1.75,
    goldReward: 450,
    bossCount: 3,
    bossInterval: 80
  }
];

export function getStageById(stageId) {
  const definedStage = stages.find((stage) => stage.stageId === stageId);

  if (definedStage) {
    return definedStage;
  }

  if (stageId > stages[stages.length - 1].stageId) {
    return createGeneratedStage(stageId);
  }

  return stages[0];
}

export function getNextStage(currentStageId) {
  const definedStage = stages.find((stage) => stage.stageId === currentStageId + 1);

  if (definedStage) {
    return definedStage;
  }

  return createGeneratedStage(currentStageId + 1);
}

function createGeneratedStage(stageId) {
  const lastStage = stages[stages.length - 1];
  const stageOffset = stageId - lastStage.stageId;
  const bossCount = 3 + Math.floor(stageOffset / 2);
  const bossInterval = stageId % 2 === 1 ? 60 : 80;

  return {
    stageId,
    stageName: `Stage ${stageId}`,
    duration: bossCount * bossInterval,
    enemySpawnRate: Math.max(650, lastStage.enemySpawnRate - (stageOffset * 100)),
    enemyHpMultiplier: lastStage.enemyHpMultiplier + (stageOffset * 0.25),
    enemyDamageMultiplier: lastStage.enemyDamageMultiplier + (stageOffset * 0.15),
    goldReward: lastStage.goldReward + (stageOffset * 75),
    bossCount,
    bossInterval
  };
}

export default stages;
