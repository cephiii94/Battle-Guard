
import { pets } from '../data/pets.js';
import { GameManager } from './GameManager.js';

export function getSelectedPetId(scene) {
  return GameManager.get('selectedPetId') || null;
}

export function setSelectedPet(scene, petId) {
  const unlockedPets = GameManager.get('unlockedPets') || [];
  const nextUnlocked = [...new Set([...unlockedPets, petId])];

  GameManager.setState({
    selectedPetId: petId,
    unlockedPets: nextUnlocked
  });
  return petId;
}

export function getUnlockedPets(scene) {
  return GameManager.get('unlockedPets') || [];
}
