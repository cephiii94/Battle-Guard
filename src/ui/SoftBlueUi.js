const COLORS = {
  bgTop: 0xdaf4ff,
  bgBottom: 0x87cdec,
  panel: 0xf6fcff,
  panelStroke: 0x609fbd,
  panelShadow: 0x417e9a,
  button: 0xe9f9ff,
  buttonHover: 0xffffff,
  buttonDown: 0xb9e7f7,
  buttonStroke: 0x397c9b,
  text: '#16475e',
  muted: '#5f8ea2',
  gold: '#f7c948',
  gem: '#7edfff',
  dark: 0x0f1f2a,
};

function roundedRectTexture(scene, key, width, height, fill, stroke, radius = 12, shadow = true) {
  if (scene.textures.exists(key)) return;

  const padding = shadow ? 5 : 2;
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  if (shadow) {
    graphics.fillStyle(COLORS.panelShadow, 0.22);
    graphics.fillRoundedRect(padding + 3, padding + 4, width, height, radius);
  }

  graphics.fillStyle(fill, 1);
  graphics.fillRoundedRect(padding, padding, width, height, radius);
  graphics.lineStyle(2, stroke, 1);
  graphics.strokeRoundedRect(padding + 1, padding + 1, width - 2, height - 2, radius);
  graphics.generateTexture(key, width + padding * 2 + 5, height + padding * 2 + 6);
  graphics.destroy();
}

function circleTexture(scene, key, size, fill, stroke) {
  if (scene.textures.exists(key)) return;

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  graphics.fillStyle(fill, 1);
  graphics.fillCircle(size / 2, size / 2, size / 2 - 2);
  graphics.lineStyle(2, stroke, 1);
  graphics.strokeCircle(size / 2, size / 2, size / 2 - 3);
  graphics.generateTexture(key, size, size);
  graphics.destroy();
}

function capsuleTexture(scene, key, width, height, fill, stroke) {
  roundedRectTexture(scene, key, width, height, fill, stroke, height / 2, true);
}

export function createSoftBlueTextures(scene) {
  roundedRectTexture(scene, 'ui-soft-panel', 180, 230, COLORS.panel, COLORS.panelStroke, 10);
  roundedRectTexture(scene, 'ui-soft-small-panel', 128, 56, COLORS.panel, COLORS.panelStroke, 10);
  roundedRectTexture(scene, 'ui-soft-pill', 96, 34, 0xffffff, COLORS.panelStroke, 17);
  roundedRectTexture(scene, 'ui-soft-button', 146, 50, COLORS.button, COLORS.buttonStroke, 10);
  roundedRectTexture(scene, 'ui-soft-button-hover', 146, 50, COLORS.buttonHover, COLORS.buttonStroke, 10);
  roundedRectTexture(scene, 'ui-soft-button-down', 146, 50, COLORS.buttonDown, COLORS.buttonStroke, 10);
  capsuleTexture(scene, 'ui-soft-play', 152, 48, COLORS.button, COLORS.buttonStroke);
  capsuleTexture(scene, 'ui-soft-play-hover', 152, 48, COLORS.buttonHover, COLORS.buttonStroke);
  capsuleTexture(scene, 'ui-soft-play-down', 152, 48, COLORS.buttonDown, COLORS.buttonStroke);
  circleTexture(scene, 'ui-settings-dot', 36, COLORS.dark, 0xffffff);
  circleTexture(scene, 'ui-avatar-ring', 62, 0xffffff, COLORS.panelStroke);
}

export function addSoftButton(scene, x, y, label, onClick, options = {}) {
  const isPlay = options.variant === 'play';
  const baseKey = isPlay ? 'ui-soft-play' : 'ui-soft-button';
  const hoverKey = isPlay ? 'ui-soft-play-hover' : 'ui-soft-button-hover';
  const downKey = isPlay ? 'ui-soft-play-down' : 'ui-soft-button-down';

  const button = scene.add.image(x, y, baseKey).setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y - 1, label, {
    fontFamily: 'Arial, sans-serif',
    fontSize: isPlay ? '20px' : '19px',
    color: COLORS.text,
    fontStyle: isPlay ? '700' : '600',
  }).setOrigin(0.5);

  button.on('pointerover', () => button.setTexture(hoverKey));
  button.on('pointerout', () => button.setTexture(baseKey));
  button.on('pointerdown', () => button.setTexture(downKey).setY(y + 1));
  button.on('pointerup', () => {
    button.setTexture(hoverKey).setY(y);
    onClick?.();
  });

  return scene.add.container(0, 0, [button, text]);
}

export function addSoftBlueBackground(scene, width, height) {
  const bg = scene.add.graphics();
  bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
  bg.fillRect(0, 0, width, height);

  bg.lineStyle(2, 0xffffff, 0.55);
  bg.strokeRoundedRect(14, 14, width - 28, height - 28, 18);

  bg.lineStyle(1, COLORS.panelStroke, 0.25);
  for (let y = 84; y < height; y += 64) {
    bg.lineBetween(28, y, width - 28, y);
  }
  for (let x = 56; x < width; x += 72) {
    bg.lineBetween(x, 28, x, height - 28);
  }

  return bg;
}

export { COLORS as SOFT_BLUE_COLORS };
