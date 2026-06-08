import { saveStageProgress, updateGold } from '../services/saveService.js';

const DEFAULT_PROGRESS = {
  gold: 230560,
  highestStageUnlocked: 1
};

export function getPlayerProgress(scene) {
  const savedProgress = scene.registry.get('playerProgress');

  if (savedProgress) {
    return savedProgress;
  }

  const progress = { ...DEFAULT_PROGRESS };
  scene.registry.set('playerProgress', progress);
  return progress;
}

export function addPlayerGold(scene, amount) {
  const progress = getPlayerProgress(scene);
  const nextProgress = {
    ...progress,
    gold: progress.gold + amount
  };

  scene.registry.set('playerProgress', nextProgress);
  updateGold(nextProgress.gold);
  return nextProgress.gold;
}

export function unlockStage(scene, stageId, completedStageId = null) {
  const progress = getPlayerProgress(scene);
  const nextProgress = {
    ...progress,
    highestStageUnlocked: Math.max(progress.highestStageUnlocked, stageId)
  };

  scene.registry.set('playerProgress', nextProgress);
  saveStageProgress({ highestStage: nextProgress.highestStageUnlocked, completedStageId });
  return nextProgress.highestStageUnlocked;
}
