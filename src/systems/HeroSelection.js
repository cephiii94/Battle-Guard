import heroes, { getHeroBaseStats, getHeroById } from '../data/heroes.js';
import { saveSelectedHero } from '../services/saveService.js';

const DEFAULT_HERO_ID = heroes[0].id;

export function getSelectedHero(scene) {
  return getHeroById(scene.registry.get('selectedHeroId') || DEFAULT_HERO_ID);
}

export function setSelectedHero(scene, heroId) {
  const hero = getHeroById(heroId);
  scene.registry.set('selectedHeroId', hero.id);
  saveSelectedHero(hero.id);
  return hero;
}

export function getSelectedHeroBaseStats(scene) {
  return getHeroBaseStats(getSelectedHero(scene));
}

export function getAvailableHeroes() {
  return heroes;
}
