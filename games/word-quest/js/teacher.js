// Teacher menu: opened by holding the ⚙️ button for 3 seconds (children don't get in by accident).
// Word sets and words (with emoji or an uploaded picture) and all options; every change is saved at once.

import { cleanSettings, defaultSettings, newId, WORD_RE } from './settings.js';
import { picHTML, esc } from './ui.js';

const $ = id => document.getElementById(id);
const HOLD_MS = 3000;

// ── The ⚙️ button: hold to open ──
export function setupGear(btn, onOpen) {
  let timer = null;
  const stop = () => { clearTimeout(timer); timer = null; btn.classList.remove('holding'); };
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    btn.classList.add('holding');
    timer = setTimeout(() => { stop(); onOpen(); }, HOLD_MS);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, () => {
    if (timer) {
      stop();
      const tip = $('gearTip');
      tip.classList.remove('hidden');
      setTimeout(() => tip.classList.add('hidden'), 1800);
    }
  });
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

// A picture file → small image (max 256 px) as a data URL, so it fits in the browser's storage.
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, 256 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        let url = c.toDataURL('image/webp', 0.85);
        if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/png');
        resolve(url);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function createTeacherMenu({ getSettings, onChange, onNewWord, onClose, sayTest }) {
  let tab = 'words';
  let editing = null;        // index of the word being edited, or null
  let pendingPic = '';       // uploaded picture waiting for "Add"

  const S = () => getSettings();
  const set = () => S().sets.find(s => s.id === S().activeSet) || S().sets[0];
  const change = () => { onChange(S()); render(); };

  $('tTabWords').onclick = () => { tab = 'words'; render(); };
  $('tTabSettings').onclick = () => { tab = 'settings'; render(); };
  $('tClose').onclick = () => onClose();
  $('tDone').onclick = () => onClose();
  $('tNewWord').onclick = () => onNewWord();
  $('tExport').onclick = () => {
    const blob = new Blob([JSON.stringify(S(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'word-quest-settings.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('tImport').onclick = () => $('tImportFile').click();
  $('tImportFile').onchange = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = cleanSettings(JSON.parse(await file.text()));
      const n = data.sets.reduce((k, s) => k + s.words.length, 0);
      if (!confirm(`Replace all words and settings with this file?\n(${data.sets.length} sets, ${n} words)`)) return;
      onChange(data);
      render();
    } catch (err) {
      alert('This file could not be read. Please choose a file saved with "Export".');
    }
  };
  $('tReset').onclick = () => {
    if (!confirm('Go back to the starting words and settings? Your own words will be removed.')) return;
    onChange(defaultSettings());
    render();
  };

  // ── Words tab ──
  function renderWords() {
    const s = S(), cur = set();
    const chips = s.sets.map(x => `<button class="t-chip ${x.id === cur.id ? 'on' : ''}" data-set="${x.id}">${esc(x.name)} <small>${x.words.length}</small></button>`).join('');
    const rows = cur.words.map((w, i) => `
      <div class="t-row ${editing === i ? 'editing' : ''}">
        <span class="t-pic">${picHTML(w.pic) || '❔'}</span>
        <b class="t-word">${esc(w.word)}</b>
        <button data-up="${i}" title="Move up" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button data-down="${i}" title="Move down" ${i === cur.words.length - 1 ? 'disabled' : ''}>▼</button>
        <button data-edit="${i}" title="Change">✏️</button>
        <button data-del="${i}" title="Delete">🗑️</button>
      </div>`).join('') || '<p class="t-note">No words yet — add the first one below.</p>';
    const w = editing !== null ? cur.words[editing] : null;
    const picNow = pendingPic || (w ? w.pic : '');
    $('tBody').innerHTML = `
      <div class="t-label">Word sets <span class="t-note">— the highlighted set is played</span></div>
      <div class="t-chips">${chips}<button class="t-chip add" id="tAddSet">＋ New set</button></div>
      <div class="t-line">
        <label>Set name <input id="tSetName" maxlength="30" value="${esc(cur.name)}"></label>
        <button id="tDelSet" ${s.sets.length < 2 ? 'disabled' : ''}>🗑️ Delete this set</button>
      </div>
      <div class="t-list">${rows}</div>
      <div class="t-form">
        <div class="t-label">${editing !== null ? 'Change word' : 'Add a word'}</div>
        <div class="t-line">
          <label>Word <input id="tWord" maxlength="10" placeholder="APPLE" value="${w ? esc(w.word) : ''}" autocomplete="off" spellcheck="false"></label>
          <label>Picture <input id="tPic" maxlength="16" placeholder="🍎" value="${picNow.startsWith('data:') ? '' : esc(picNow)}" autocomplete="off"></label>
          <button id="tUpload">🖼️ Upload picture</button>
          <span class="t-pic big" id="tPicPreview">${picHTML(picNow)}</span>
          <input type="file" id="tFile" accept="image/*" hidden>
        </div>
        <div class="t-note">English letters only, 2–10 letters. For an emoji press <kbd>Win</kbd> + <kbd>.</kbd></div>
        <div class="t-line">
          <button class="t-primary" id="tSaveWord">${editing !== null ? '✔ Save' : '＋ Add'}</button>
          ${editing !== null ? '<button id="tCancelEdit">Cancel</button>' : ''}
          <span class="t-error" id="tError"></span>
        </div>
      </div>`;

    $('tBody').querySelectorAll('[data-set]').forEach(b => b.onclick = () => { S().activeSet = b.dataset.set; editing = null; pendingPic = ''; change(); });
    $('tAddSet').onclick = () => {
      const id = newId();
      S().sets.push({ id, name: 'New set', words: [] });
      S().activeSet = id;
      editing = null; change();
      $('tSetName').select();
    };
    $('tSetName').onchange = e => { cur.name = e.target.value.trim() || 'Words'; change(); };
    $('tDelSet').onclick = () => {
      if (!confirm(`Delete the set "${cur.name}" and its ${cur.words.length} words?`)) return;
      S().sets = S().sets.filter(x => x.id !== cur.id);
      S().activeSet = S().sets[0].id;
      editing = null; change();
    };
    const move = (i, d) => { const [x] = cur.words.splice(i, 1); cur.words.splice(i + d, 0, x); editing = null; change(); };
    $('tBody').querySelectorAll('[data-up]').forEach(b => b.onclick = () => move(+b.dataset.up, -1));
    $('tBody').querySelectorAll('[data-down]').forEach(b => b.onclick = () => move(+b.dataset.down, 1));
    $('tBody').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { editing = +b.dataset.edit; pendingPic = ''; render(); $('tWord').focus(); });
    $('tBody').querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const i = +b.dataset.del;
      if (!confirm(`Delete "${cur.words[i].word}"?`)) return;
      cur.words.splice(i, 1); editing = null; change();
    });
    $('tPic').oninput = e => { pendingPic = e.target.value.trim(); $('tPicPreview').innerHTML = picHTML(pendingPic); };
    $('tUpload').onclick = () => $('tFile').click();
    $('tFile').onchange = async e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try { pendingPic = await shrinkImage(file); $('tPic').value = ''; $('tPicPreview').innerHTML = picHTML(pendingPic); }
      catch (err) { $('tError').textContent = 'This picture could not be opened.'; }
    };
    if ($('tCancelEdit')) $('tCancelEdit').onclick = () => { editing = null; pendingPic = ''; render(); };
    const save = () => {
      const word = $('tWord').value.trim();
      if (!WORD_RE.test(word)) { $('tError').textContent = 'Use 2–10 English letters, no spaces.'; return; }
      const pic = pendingPic || $('tPic').value.trim() || (editing !== null ? cur.words[editing].pic : '');
      const entry = { word: word.toUpperCase(), pic };
      if (editing !== null) cur.words[editing] = entry; else cur.words.push(entry);
      editing = null; pendingPic = '';
      change();
      $('tWord').focus();
    };
    $('tSaveWord').onclick = save;
    $('tWord').onkeydown = e => { if (e.key === 'Enter') save(); };
  }

  // ── Settings tab ──
  const select = (key, options, value) => `<select data-key="${key}">${options.map(([v, t]) => `<option value="${v}" ${String(v) === String(value) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const toggle = (key, value) => `<label class="t-toggle"><input type="checkbox" data-key="${key}" ${value ? 'checked' : ''}><span></span></label>`;
  const range = (key, min, max, step, value) => `<input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${value}">`;

  function renderSettings() {
    const s = S();
    const row = (label, control, note = '') => `<div class="t-set"><span>${label}${note ? ` <small class="t-note">${note}</small>` : ''}</span>${control}</div>`;
    $('tBody').innerHTML = `
      <div class="t-label">Words</div>
      ${row('Next word', select('play.order', [['order', 'In order'], ['random', 'Random'], ['manual', 'Choose before each game']], s.play.order))}
      ${row('After a win, A plays', select('play.replay', [['next', 'The next word'], ['same', 'The same word again']], s.play.replay))}
      <div class="t-label">Chests and sums</div>
      ${row('Numbers up to', select('math.max', [[10, '10'], [20, '20'], [30, '30']], s.math.max))}
      ${row('Sums', select('math.ops', [['+', 'Only +'], ['-', 'Only −'], ['both', '+ and −']], s.math.ops))}
      ${row('Letters in chests', select('chests.share', [[0, 'None'], [0.25, 'A few (25%)'], [0.45, 'About half'], [0.75, 'Most (75%)']], s.chests.share))}
      <div class="t-label">Map</div>
      ${row('Decoy letters', toggle('decoys.enabled', s.decoys.enabled))}
      ${row('How many decoys', select('decoys.count', [1, 2, 3, 4, 5, 6].map(n => [n, n]), s.decoys.count))}
      ${row('Raccoon, slimes and bee', toggle('mobs.enabled', s.mobs.enabled), 'stage 7')}
      ${row('Secret cave', toggle('cave.enabled', s.cave.enabled), 'stage 10')}
      <div class="t-label">Sound</div>
      ${row('Voice volume', range('voice.volume', 0, 1, 0.1, s.voice.volume) + '<button id="tSayTest">🔊 Test</button>')}
      ${row('Voice speed', range('voice.rate', 0.6, 1.2, 0.05, s.voice.rate), 'slow … fast')}
      ${row('Music volume', range('audio.music', 0, 1, 0.05, s.audio.music), 'stage 9')}
      <div class="t-label">Gamepad</div>
      ${row('D-pad', select('controls.dpad', [['iso', 'Along the map grid (diagonal)'], ['screen', 'Up is up on the screen']], s.controls.dpad))}
      ${row('Swap A and B', toggle('controls.swapAB', s.controls.swapAB), 'if A and B work the wrong way round')}`;

    $('tBody').querySelectorAll('[data-key]').forEach(el => {
      el.onchange = () => {
        const [group, key] = el.dataset.key.split('.');
        let v = el.type === 'checkbox' ? el.checked : el.value;
        if (el.type === 'range' || /^(math\.max|chests\.share|decoys\.count)$/.test(el.dataset.key)) v = +v;
        S()[group][key] = v;
        onChange(S());
      };
    });
    $('tSayTest').onclick = sayTest;
  }

  function render() {
    $('tTabWords').classList.toggle('on', tab === 'words');
    $('tTabSettings').classList.toggle('on', tab === 'settings');
    if (tab === 'words') renderWords(); else renderSettings();
  }

  return {
    open() { editing = null; pendingPic = ''; render(); $('teacher').classList.remove('hidden'); },
    close() { $('teacher').classList.add('hidden'); },
  };
}
