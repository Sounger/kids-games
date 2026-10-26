# K3 Games — rules for Claude

Teacher Sam's collection of educational web games for his K3 kindergarten class
(children aged 4–6) in Bangkok. Everything is published as one website on GitHub Pages:
the menu is at the root, every game lives in its own folder.

Talk to Sam in Russian; keep code, comments and in-game text in English.

## Layout
- `games/<slug>/` — one game per folder. `slug` is short kebab-case (`count-fish`).
  - Bigger games: Vite + React + TypeScript (copy an existing game's `package.json`,
    `vite.config.ts`, `tsconfig.json`). Keep `base: './'` in `vite.config.ts`.
  - Light games (preferred for new ones): a plain `index.html` (+ optional `.js`/`.css`/assets),
    no build step. Everything relative-pathed, no leading `/`.
- `hub/index.html` — the menu. Add every new game to the `GAMES` array there
  (slug, title, emoji, subject, one-line `about`, pastel `color`).
- `scripts/build.sh` — builds all games into `site/` and adds a 🏠 back-to-menu button.
  `bash scripts/build.sh <slug>` builds just one.
- `.github/workflows/pages.yml` — every push to `main` rebuilds and publishes the site.

## Game rules
- Audience is 4–6 year olds: huge tap targets (≥ 64px), very few words, clear pictures/emoji,
  sound + animation for feedback, never a harsh "wrong" — encourage and let them retry.
- Must work with a finger on a tablet, with a mouse on the classroom Windows PC, and on a projector.
  Test at phone width too.
- **No AI/API calls and no API keys** — the site is public, a key would leak. Generate
  questions with plain code (random numbers, word lists, templates).
- No accounts, no collecting children's data. `localStorage` only for small things like high scores.
- English UI. Keep the colorful, friendly style of the existing games.

## Before finishing
1. `bash scripts/build.sh <slug>` and open `site/` with a local server to check the game and the menu.
2. Commit with a clear message and push to `main` — publishing is automatic.
