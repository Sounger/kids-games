# K3 Games 🎮

Educational web games for K3 kids. One link, all games, any device.

| Game | Subject |
|---|---|
| Pixel Math Dungeon | Math |
| Pixel Math Quiz | Math |
| Math Adventure | Math |
| Missing Number | Math |
| Word Wheel | Letters |
| Super Typer | Letters |
| Magic Forest | Board game |
| PixelBeats | Music |
| GigglePix | Art |

## How it works
- Each game is a folder in `games/`. The menu is `hub/index.html`.
- Every push to `main` builds everything and publishes it to GitHub Pages
  (`.github/workflows/pages.yml`).
- Build locally: `bash scripts/build.sh`, then serve the `site/` folder
  (for example `npx serve site`).

Games were first made in Google AI Studio; the AI parts were replaced with plain code
so the site needs no API keys.
