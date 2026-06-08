export default class SkillHud {
  constructor(scene, activeSkillSystem) {
    this.scene = scene;
    this.activeSkillSystem = activeSkillSystem;
    this.items = [];

    activeSkillSystem.on('skillsChanged', () => this.render());
    this.render();
  }

  render() {
    this.clear();
    const skills = this.activeSkillSystem.getOwnedSkills();

    this.add(this.scene.add.rectangle(1084, 94, 268, 82, 0x07111f, 0.78))
      .setStrokeStyle(2, 0x38bdf8, 0.55);
    this.add(this.scene.add.text(970, 58, 'SKILLS', {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 4
    }));

    if (skills.length === 0) {
      this.add(this.scene.add.text(970, 86, 'Level up untuk unlock skill', {
        fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
        fontSize: '14px',
        color: '#cbd5e1',
        stroke: '#020617',
        strokeThickness: 4
      }));
      return;
    }

    skills.slice(0, 4).forEach((skill, index) => {
      const x = 990 + (index * 58);
      this.add(this.scene.add.circle(x, 101, 22, 0x132033, 1))
        .setStrokeStyle(2, 0xfacc15, 0.9);
      this.add(this.scene.add.image(x, 99, skill.assetKey).setDisplaySize(40, 40));
      this.add(this.scene.add.text(x, 116, `Lv ${skill.level}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#93c5fd',
        fontStyle: '900',
        stroke: '#020617',
        strokeThickness: 3
      }).setOrigin(0.5));
    });
  }

  add(item) {
    item.setScrollFactor(0);
    item.setDepth(1000);
    this.items.push(item);
    return item;
  }

  clear() {
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }
}
