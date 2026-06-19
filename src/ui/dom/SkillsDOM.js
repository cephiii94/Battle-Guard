import skills from '../../data/skills.js';
import { getPlayerProgress, getSkillLevelsForPlayerLevel, spendSkillPoint } from '../../systems/PlayerProgress.js';
import { GameManager } from '../../systems/GameManager.js';

import { soundManager } from '../../services/soundManager.js';

export class SkillsDOM {
  constructor(scene, domManager) {
    this.scene = scene;
    this.domManager = domManager;
  }

  show() {
    this.scene.playerProgress = getPlayerProgress(this.scene);
    
    const htmlString = `
      <div class="skills-container">
        <div class="skills-header">
          <div class="skills-title">
            <h2>⚡ PLAYER SKILLS ROAD</h2>
            <p>Spend Skill Points earned from leveling up to unlock and upgrade passive/active skills.</p>
          </div>
          <button class="skills-close-btn" id="btn-close-skills">◀</button>
        </div>
        
        <div class="skills-content">
          <div class="skills-road-panel">
            <div class="skills-road-container">
              <div class="road-path"></div>
              <div class="road-path-active" id="road-path-active"></div>
              <div class="road-nodes" id="road-nodes">
                <!-- Injected -->
              </div>
            </div>
            <div class="skills-upgrade-panel" id="upgrade-panel">
              <!-- Injected -->
            </div>
          </div>
          
          <div class="skills-cumulative-panel">
            <div class="cumulative-title">TOTAL PASSIVE EFFECT</div>
            <div class="cumulative-list" id="cumulative-list">
              <!-- Injected -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.domManager.showOverlay('skills', htmlString, 'skills-overlay', (wrapper) => {
      this.wrapper = wrapper;
      
      this.wrapper.querySelector('#btn-close-skills').addEventListener('click', () => {
        soundManager.playSFX(this.scene, 'click');
        this.domManager.closeCurrent();
      });

      this.updateAll();
    });
  }

  hide() {
    this.domManager.closeCurrent();
  }

  updateAll() {
    this.renderRoad();
    this.renderUpgradePanel();
    this.renderCumulativePanel();
  }

  renderRoad() {
    const nodesContainer = this.wrapper.querySelector('#road-nodes');
    nodesContainer.innerHTML = '';

    const p = this.scene.playerProgress;
    const playerLvl = p.playerLevel || 1;
    const unlockedSkillLvl = p.unlockedSkillLevel || 1;

    let startL = Math.max(1, unlockedSkillLvl - 1);
    if (startL + 4 > 55) {
      startL = 51;
    }

    const activeSegments = Math.min(4, unlockedSkillLvl - startL);
    const pathActive = this.wrapper.querySelector('#road-path-active');
    
    pathActive.style.height = `${(activeSegments / 4) * 100}%`;

    for (let i = 0; i < 5; i++) {
      const levelNum = startL + i;
      
      const isUnlocked = levelNum <= unlockedSkillLvl;
      const isNextTarget = levelNum === unlockedSkillLvl + 1;
      const canUnlockWithGold = isNextTarget && levelNum <= playerLvl;

      const skillIndex = (levelNum - 1) % 11;
      const skill = skills[skillIndex];
      const targetLvl = Math.floor((levelNum - 1) / 11) + 1;

      let buffDetail = '';
      if (skill.type === 'passive') {
        switch (skill.id) {
          case 'magnet': buffDetail = `+${targetLvl * 20}px Loot Magnet`; break;
          case 'movespeed': buffDetail = `+${targetLvl * 4}% Hero Speed`; break;
          case 'aspd': buffDetail = `+${targetLvl * 5}% Attack Speed`; break;
          case 'hp-regen': buffDetail = `+${(targetLvl * 0.5).toFixed(1)} HP/s Regen`; break;
          case 'shield': buffDetail = `+${targetLvl * 10} Shield Capacity`; break;
          case 'attack-range': buffDetail = `+${targetLvl * 5}% Attack Range`; break;
          case 'knock': buffDetail = `+${targetLvl * 10}% Knockback`; break;
        }
      } else {
        buffDetail = `+${targetLvl * 8}% Dmg / -${targetLvl * 5}% CD`;
      }

      let statusClass = '';
      let statusIcon = '';
      if (isUnlocked) {
        statusClass = 'unlocked';
        statusIcon = '✓';
      } else if (canUnlockWithGold) {
        statusClass = 'next';
        statusIcon = '⭐';
      } else {
        statusIcon = '🔒';
      }

      const node = document.createElement('div');
      node.className = `road-node ${statusClass}`;
      
      let iconSrc = `/assets/skills/${skill.assetKey.replace('skill-', '')}.svg`;
      
      node.innerHTML = `
        <div class="node-level">${levelNum} Lv</div>
        <div class="node-circle">
          <img src="${iconSrc}" onerror="this.src='/assets/ui/icon-gem.svg'" />
          <div class="node-status-icon">${statusIcon}</div>
        </div>
        <div class="node-info">
          <div class="node-title">${skill.name}</div>
          <div class="node-desc">${buffDetail}</div>
        </div>
      `;

      nodesContainer.prepend(node);
    }
  }

  renderUpgradePanel() {
    const panel = this.wrapper.querySelector('#upgrade-panel');
    const p = this.scene.playerProgress;
    const playerLvl = p.playerLevel || 1;
    const unlockedSkillLvl = p.unlockedSkillLevel || 1;
    const targetLvl = unlockedSkillLvl + 1;
    const maxed = unlockedSkillLvl >= 55;
    
    const skillPoints = GameManager.get('skillPoints') || 0;

    if (maxed) {
      panel.innerHTML = `
        <div class="upgrade-info" style="width: 100%; text-align: center; color: #1e293b; font-size: 20px; font-weight: 900;">
          MAX SKILL ROAD LEVEL REACHED
        </div>
      `;
      return;
    }

    const isLockedByLevel = targetLvl > playerLvl;
    const hasEnoughPoints = skillPoints >= 1;
    const canUnlock = hasEnoughPoints && !isLockedByLevel;

    let btnClass = canUnlock ? 'ready' : 'locked';
    let btnLabel = 'UNLOCK';
    if (isLockedByLevel) btnLabel = `REQ: PLAYER LV. ${targetLvl}`;
    else if (!hasEnoughPoints) btnLabel = 'NO SKILL POINTS';

    let pointsColor = (hasEnoughPoints && !isLockedByLevel) ? '#16a34a' : '#dc2626';

    panel.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-target">${targetLvl} LEVEL</div>
        <div class="upgrade-points" style="color: ${pointsColor}">🌟 Skill Points: ${skillPoints}</div>
      </div>
      <button class="btn-unlock ${btnClass}" ${canUnlock ? '' : 'disabled'}>${btnLabel}</button>
    `;

    if (canUnlock) {
      panel.querySelector('.btn-unlock').addEventListener('click', () => {
        this.upgradePlayerLevel(unlockedSkillLvl);
      });
    }
  }

  upgradePlayerLevel(currentLvl) {
    const result = spendSkillPoint(this.scene);
    if (!result.success) {
      soundManager.playSFX(this.scene, 'hit');
      this.scene.showUpgradeFeedback(false, 'No Skill Points!');
      return;
    }

    soundManager.playSFX(this.scene, 'upgrade');

    const nextLvl = currentLvl + 1;
    const nextSkillLevels = getSkillLevelsForPlayerLevel(nextLvl);

    GameManager.setState({
      unlockedSkillLevel: nextLvl,
      skillLevels: nextSkillLevels
    });

    this.scene.showUpgradeFeedback(true, `Unlocked Road Level ${nextLvl}!`);

    this.scene.refreshHeroLoadout();
    
    this.updateAll();
  }

  renderCumulativePanel() {
    const list = this.wrapper.querySelector('#cumulative-list');
    list.innerHTML = '';

    const skillLevels = GameManager.get('skillLevels') || {};

    skills.forEach(skill => {
      const currentLvl = skillLevels[skill.id] || 0;
      const isActive = currentLvl > 0;
      
      let effectText = 'LOCKED';
      if (isActive) {
        if (skill.type === 'passive') {
          switch (skill.id) {
            case 'magnet': effectText = `+${currentLvl * 20}px Radius`; break;
            case 'movespeed': effectText = `+${currentLvl * 4}% Speed`; break;
            case 'aspd': effectText = `+${currentLvl * 5}% Atk Speed`; break;
            case 'hp-regen': effectText = `+${(currentLvl * 0.5).toFixed(1)} HP/s`; break;
            case 'shield': effectText = `+${currentLvl * 10} Shield`; break;
            case 'attack-range': effectText = `+${currentLvl * 5}% Range`; break;
            case 'knock': effectText = `+${currentLvl * 10}% Knockback`; break;
          }
        } else {
          effectText = `+${currentLvl * 8}% Dmg, -${currentLvl * 5}% CD`;
        }
      }

      let iconSrc = `/assets/skills/${skill.assetKey.replace('skill-', '')}.svg`;

      const row = document.createElement('div');
      row.className = 'cumul-row';
      row.innerHTML = `
        <img class="cumul-icon ${isActive ? 'active' : ''}" src="${iconSrc}" onerror="this.src='/assets/ui/icon-gem.svg'" />
        <div class="cumul-name ${isActive ? 'active' : ''}">${skill.name}</div>
        <div class="cumul-level ${isActive ? 'active' : ''}">Lv. ${currentLvl}/5</div>
        <div class="cumul-effect ${isActive ? 'active' : ''}">${effectText}</div>
      `;

      list.appendChild(row);
    });
  }
}
