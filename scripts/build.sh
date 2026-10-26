#!/usr/bin/env bash
# Builds every game in games/ and the menu into site/ (what GitHub Pages serves).
# Usage: bash scripts/build.sh            — build all games
#        bash scripts/build.sh super-typer — build only one game (menu is always copied)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
mkdir -p "$SITE"

# Small "back to menu" button added to every game page.
HOME_BUTTON='<a href="../" aria-label="Back to all games" style="position:fixed;left:12px;bottom:12px;z-index:99999;width:52px;height:52px;border-radius:50%;background:#fff;border:3px solid #2b2140;box-shadow:0 4px 0 #2b2140;display:flex;align-items:center;justify-content:center;font-size:26px;text-decoration:none;opacity:.85">🏠</a>'

if [ $# -gt 0 ]; then GAMES=("$@"); else GAMES=(); for d in "$ROOT"/games/*/; do GAMES+=("$(basename "$d")"); done; fi

for game in "${GAMES[@]}"; do
  dir="$ROOT/games/$game"
  [ -f "$dir/index.html" ] || { echo "skip $game (no index.html)"; continue; }
  if [ -f "$dir/package.json" ]; then
    echo "▶ building $game (Vite)"
    (
      cd "$dir"
      if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --loglevel=error; else npm install --no-audit --no-fund --loglevel=error; fi
      npx vite build --base=./ --outDir "$SITE/$game" --emptyOutDir --logLevel warn
    )
  else
    # simple game: plain HTML/CSS/JS files, copied as they are
    echo "▶ copying $game (plain HTML)"
    rm -rf "$SITE/$game" && mkdir -p "$SITE/$game"
    cp -R "$dir"/. "$SITE/$game"/
  fi
  python3 - "$SITE/$game/index.html" "$HOME_BUTTON" <<'EOF'
import sys
path, button = sys.argv[1], sys.argv[2]
html = open(path, encoding='utf-8').read()
if 'aria-label="Back to all games"' not in html:
    html = html.replace('</body>', button + '\n</body>', 1)
open(path, 'w', encoding='utf-8').write(html)
EOF
done

cp "$ROOT/hub/index.html" "$SITE/index.html"
touch "$SITE/.nojekyll"
echo "✔ done → $SITE"
