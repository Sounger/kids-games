// English voice through the browser's Web Speech API (no files, no internet service).

// Spelled the way a speech engine reads them as letter names ("A" alone is often read as "uh").
const LETTER_NAMES = {
  A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'jee', H: 'aitch', I: 'eye',
  J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'ar',
  S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee',
};
export const letterName = ch => LETTER_NAMES[ch] || ch;

export function createVoice(cfg) {
  const synth = window.speechSynthesis;
  let voice = null;

  // Prefer a natural-sounding US or UK voice when the computer has one.
  function pickVoice() {
    const all = synth ? synth.getVoices() : [];
    const en = all.filter(v => /^en[-_]/i.test(v.lang));
    const score = v => {
      let s = 0;
      if (/^en[-_]US/i.test(v.lang)) s += 4; else if (/^en[-_]GB/i.test(v.lang)) s += 3;
      if (/natural|online/i.test(v.name)) s += 4;
      if (/aria|jenny|google us english|samantha|zira/i.test(v.name)) s += 2;
      return s;
    };
    voice = en.sort((a, b) => score(b) - score(a))[0] || null;
  }
  if (synth) {
    pickVoice();
    synth.addEventListener?.('voiceschanged', pickVoice);
  }

  // Says the parts one after another; onPart(i) fires as part i starts.
  function speak(parts, { onPart, interrupt = true } = {}) {
    if (!synth) return;
    if (interrupt) synth.cancel();
    parts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'en-US';
      u.rate = cfg.rate; u.pitch = cfg.pitch; u.volume = cfg.volume;
      if (onPart) u.onstart = () => onPart(i);
      if (onPart && i === parts.length - 1) u.onend = () => onPart(-1);
      synth.speak(u);
    });
  }

  return {
    speak,
    cancel: () => synth?.cancel(),
    // "Apple. A-P-P-L-E. Apple!" — onLetter(n) highlights letter n (-1 = none).
    // intro: something said first, like the player's name.
    spell(word, onLetter, intro = '') {
      const w = word.toLowerCase(), first = intro ? 1 : 0;
      speak([...(intro ? [intro] : []), `${w}.`, ...[...word].map(letterName), `${w}!`], {
        onPart: i => onLetter?.(i >= first + 1 && i <= first + word.length ? i - first - 1 : -1),
      });
    },
    letter: ch => speak([`${letterName(ch)}!`]),
    get voiceName() { return voice?.name || '(default)'; },
  };
}
