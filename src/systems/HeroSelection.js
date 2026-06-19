import heroes, { getHeroBaseStats, getHeroById } from '../data/heroes.js';
import { GameManager } from './GameManager.js';

const DEFAULT_HERO_ID = heroes[0].id;

export function getSelectedHero(scene) {
  return getHeroById(GameManager.get('selectedHeroId') || DEFAULT_HERO_ID);
}

export function setSelectedHero(scene, heroId) {
  const hero = getHeroById(heroId);
  const unlockedHeroes = GameManager.get('unlockedHeroes') || [];
  const nextUnlocked = [...new Set([...unlockedHeroes, heroId])];

  GameManager.setState({
    selectedHeroId: hero.id,
    unlockedHeroes: nextUnlocked
  });
  return hero;
}

export function getSelectedHeroBaseStats(scene) {
  return getHeroBaseStats(getSelectedHero(scene));
}

export function getAvailableHeroes() {
  return heroes;
}
