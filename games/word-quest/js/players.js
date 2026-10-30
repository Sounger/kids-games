// Player profiles: a first name, an animal picture, and how many words / crystals they found.
// Kept only in this browser (localStorage) — nothing is sent anywhere.

const KEY = 'wq-players';
export const AVATARS = ['🦁', '🐼', '🐸', '🐵', '🐯', '🐰', '🦊', '🐨', '🐶', '🐱', '🐧', '🦄'];
export const NAME_RE = /^[\p{L}][\p{L} '-]{0,13}$/u;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && Array.isArray(raw.list)) {
      const list = raw.list
        .filter(p => p && typeof p.name === 'string' && NAME_RE.test(p.name))
        .map(p => ({
          id: String(p.id || Math.random().toString(36).slice(2, 9)),
          name: p.name,
          avatar: AVATARS.includes(p.avatar) ? p.avatar : AVATARS[0],
          words: Number.isFinite(p.words) ? p.words : 0,
          crystals: Number.isFinite(p.crystals) ? p.crystals : 0,
        }));
      return { list, current: list.some(p => p.id === raw.current) ? raw.current : null };
    }
  } catch (e) {}
  return { list: [], current: null };
}

export function createPlayers() {
  const data = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
  return {
    get list() { return data.list; },
    // The player now at the controls, or null for a guest.
    get current() { return data.list.find(p => p.id === data.current) || null; },
    choose(id) { data.current = id; save(); },
    add(name, avatar) {
      const p = { id: Math.random().toString(36).slice(2, 9), name: name.trim(), avatar, words: 0, crystals: 0 };
      data.list.push(p);
      data.current = p.id;
      save();
      return p;
    },
    rename(id, name) { const p = data.list.find(x => x.id === id); if (p && NAME_RE.test(name.trim())) { p.name = name.trim(); save(); } },
    setAvatar(id, avatar) { const p = data.list.find(x => x.id === id); if (p) { p.avatar = avatar; save(); } },
    remove(id) { data.list = data.list.filter(p => p.id !== id); if (data.current === id) data.current = null; save(); },
    resetScores() { data.list.forEach(p => { p.words = 0; p.crystals = 0; }); save(); },
    // A word was finished: count it for the current player.
    won(crystals) { const p = this.current; if (p) { p.words++; p.crystals += crystals; save(); } },
  };
}
