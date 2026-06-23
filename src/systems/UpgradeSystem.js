import Phaser from 'phaser';
import UpgradePopup from '../ui/UpgradePopup.js';
import EffectSystem from './EffectSystem.js';

const UPGRADE_DEFINITIONS = [
  {
    id: 'damage',
    title: 'Damage +10%',
    description: 'Projectile damage naik.',
    apply: ({ player }) => player.increaseDamage(0.1)
  },
  {
    id: 'attack-speed',
    title: 'Attack Speed +10%',
    description: 'Hero menembak lebih cepat.',
    apply: ({ player }) => player.increaseAttackSpeed(0.1)
  },
  {
    id: 'max-hp',
    title: 'Max HP +20%',
    description: 'HP maksimum bertambah.',
    apply: ({ player }) => player.increaseMaxHp(0.2)
  },
  {
    id: 'movement-speed',
    title: 'Movement Speed +10%',
    description: 'Hero bergerak lebih cepat.',
    apply: ({ player }) => player.increaseMovementSpeed(0.1)
  },
  {
    id: 'critical-chance',
    title: 'Critical Chance +5%',
    description: 'Peluang damage critical bertambah.',
    apply: ({ player }) => player.increaseCriticalChance(0.05)
  },
  {
    id: 'health-regen',
    title: 'HP Regen +1.0/s',
    description: 'Kecepatan regenerasi HP bertambah.',
    apply: ({ player }) => player.increaseHealthRegen(1.0)
  },
  {
    id: 'armor',
    title: 'Armor +2',
    description: 'Ketahanan fisik bertambah.',
    apply: ({ player }) => player.increaseArmor(2)
  },
  {
    id: 'lifesteal',
    title: 'Lifesteal +3%',
    description: 'Menyerap HP dari damage serangan.',
    apply: ({ player }) => player.increaseLifesteal(0.03)
  },
  {
    id: 'evasion',
    title: 'Evasion +4%',
    description: 'Peluang menghindari tabrakan monster.',
    apply: ({ player }) => player.increaseEvasion(0.04)
  },
  {
    id: 'cooldown-reduction',
    title: 'CDR +5%',
    description: 'Cooldown skill aktif lebih cepat.',
    apply: ({ player }) => player.increaseCooldownReduction(0.05)
  }
];

export default class UpgradeSystem {
  constructor(scene, player, gameStats) {
    this.scene = scene;
    this.player = player;
    this.gameStats = gameStats;
    this.popup = new UpgradePopup(scene, (upgrade) => this.chooseUpgrade(upgrade));
    this.pendingLevelUps = 0;
    this.isChoosing = false;

    this.gameStats.on('levelUp', () => this.queueUpgradeChoice());
  }

  queueUpgradeChoice() {
    this.pendingLevelUps += 1;
    EffectSystem.createLevelUpEffect(this.scene, this.player.x, this.player.y);

    if (!this.isChoosing) {
      this.showNextChoice();
    }
  }

  showNextChoice() {
    if (this.pendingLevelUps <= 0) {
      this.isChoosing = false;
      this.scene.setGameplayPaused(false);
      return;
    }

    this.pendingLevelUps -= 1;
    this.isChoosing = true;
    this.scene.setGameplayPaused(true);
    this.popup.show(this.getRandomUpgrades(3));
  }

  chooseUpgrade(upgrade) {
    upgrade.apply({
      player: this.player,
      scene: this.scene,
      gameStats: this.gameStats
    });

    this.popup.hide();
    this.showNextChoice();
  }

  getRandomUpgrades(count) {
    return Phaser.Utils.Array.Shuffle([...UPGRADE_DEFINITIONS]).slice(0, count);
  }
}
