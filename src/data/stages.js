const stages = [
  {
    stageId: 1,
    stageName: 'Stage 1',
    duration: 60,
    enemySpawnRate: 1800,
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    goldReward: 100
  },
  {
    stageId: 2,
    stageName: 'Stage 2',
    duration: 75,
    enemySpawnRate: 1500,
    enemyHpMultiplier: 1.25,
    enemyDamageMultiplier: 1.15,
    goldReward: 150
  },
  {
    stageId: 3,
    stageName: 'Stage 3',
    duration: 90,
    enemySpawnRate: 1250,
    enemyHpMultiplier: 1.55,
    enemyDamageMultiplier: 1.3,
    goldReward: 225
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

  return {
    stageId,
    stageName: `Stage ${stageId}`,
    duration: lastStage.duration + 15,
    enemySpawnRate: Math.max(650, lastStage.enemySpawnRate - (stageOffset * 100)),
    enemyHpMultiplier: lastStage.enemyHpMultiplier + (stageOffset * 0.25),
    enemyDamageMultiplier: lastStage.enemyDamageMultiplier + (stageOffset * 0.15),
    goldReward: lastStage.goldReward + (stageOffset * 75)
  };
}

export default stages;
