// Gamepad (D-pad + A + B), keyboard and mouse — all active at the same time.
//   dirs     — which of up/down/left/right are held this frame
//   pressed(name) — true on the frame a button went down: 'A', 'B', 'pause', 'fullscreen'
//   clicks   — left clicks on the canvas this frame (client coordinates)

const KEY_DIRS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
};
const KEY_BUTTONS = {
  Space: 'A', Enter: 'A', NumpadEnter: 'A',
  KeyX: 'B', Backspace: 'B',
  Escape: 'pause', KeyF: 'fullscreen',
};

export function createInput(canvas, cfg) {
  const held = new Set();          // keyboard directions held
  const queued = new Set();        // button presses since the last frame
  let clicks = [];
  const padPrev = { A: false, B: false };
  const lastPress = {};

  const press = name => {
    const now = performance.now();
    if (now - (lastPress[name] || 0) < cfg.repeatGuardMs) return;
    lastPress[name] = now;
    queued.add(name);
  };

  addEventListener('keydown', e => {
    if (KEY_DIRS[e.code]) { held.add(KEY_DIRS[e.code]); e.preventDefault(); }
    if (KEY_BUTTONS[e.code]) {
      if (e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      if (!e.repeat) press(KEY_BUTTONS[e.code]);
    }
  });
  addEventListener('keyup', e => { if (KEY_DIRS[e.code]) held.delete(KEY_DIRS[e.code]); });
  addEventListener('blur', () => held.clear());

  canvas.addEventListener('pointerdown', e => {
    if (e.button === 0) clicks.push({ x: e.clientX, y: e.clientY });
    if (e.button === 2) press('B');
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Read the first connected gamepad. Standard layout: A = 0, B = 1, D-pad = 12–15.
  // Some pads send the D-pad as stick axes or as a "hat" on axis 9 — those work too.
  function readPad() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const out = { connected: pads.length > 0, name: pads[0]?.id || '', up: false, down: false, left: false, right: false, A: false, B: false };
    for (const pad of pads) {
      const btn = i => !!pad.buttons[i]?.pressed;
      const [a, b] = cfg.swapAB ? [1, 0] : [0, 1];
      out.A ||= btn(a); out.B ||= btn(b);
      out.up ||= btn(12); out.down ||= btn(13); out.left ||= btn(14); out.right ||= btn(15);
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      out.left ||= ax < -0.5; out.right ||= ax > 0.5; out.up ||= ay < -0.5; out.down ||= ay > 0.5;
      const hat = pad.mapping === 'standard' ? undefined : pad.axes[9];
      if (hat !== undefined && hat >= -1.05 && hat <= 1.05) {
        // 8 positions from -1 (up) clockwise in steps of 2/7.
        const pos = Math.round((hat + 1) * 3.5);
        out.up ||= pos === 0 || pos === 1 || pos === 7;
        out.right ||= pos >= 1 && pos <= 3;
        out.down ||= pos >= 3 && pos <= 5;
        out.left ||= pos >= 5 && pos <= 7;
      }
    }
    return out;
  }

  const input = {
    dirs: { up: false, down: false, left: false, right: false },
    pad: { connected: false, name: '' },
    clicks: [],
    pressedNow: new Set(),
    pressed: name => input.pressedNow.has(name),
    update() {
      const pad = readPad();
      for (const name of ['A', 'B']) {
        if (pad[name] && !padPrev[name]) press(name);
        padPrev[name] = pad[name];
      }
      input.pad = { connected: pad.connected, name: pad.name };
      for (const d of ['up', 'down', 'left', 'right']) input.dirs[d] = held.has(d) || pad[d];
      input.pressedNow = new Set(queued);
      queued.clear();
      input.clicks = clicks;
      clicks = [];
    },
  };
  return input;
}
