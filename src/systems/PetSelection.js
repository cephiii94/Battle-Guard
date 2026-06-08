import { saveSelectedPet } from '../services/saveService.js';

export function getSelectedPetId(scene) {
  return scene.registry.get('selectedPetId') || null;
}

export function setSelectedPet(scene, petId) {
  scene.registry.set('selectedPetId', petId);
  saveSelectedPet(petId);
  return petId;
}

export function getUnlockedPets(scene) {
  return scene.registry.get('unlockedPets') || [];
}
