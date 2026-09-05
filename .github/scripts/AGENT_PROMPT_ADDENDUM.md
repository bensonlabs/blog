# Site-integration addendum for game-build prompts

Build a standalone game at `projects/games/<slug>/index.html` with its own complete
HTML document, styles, and scripts. Do not add Jekyll front matter, a site-header
snippet, canonical markers, or navigation auto-hide machinery. No screen corner
is reserved for the website: place game controls where they work best on desktop
and mobile. Preserve game navigation, fullscreen behavior, audio, and saved state.
An optional back-to-games link is allowed. Choose CSP for your actual game assets.

Author one `bl-game-meta` comment in the head, with `title`, `emoji`, `order: 999`,
and a one-line `description`. When applicable, end the description with
`Made by <model> in <tool> on <hardware>.` Do not guess a curated sort position.
For compiled games use `game.json`, as described in `GAME_METADATA.md`. Keep Vite's
source input and deployed base path; generated HTML is output, not metadata input.

Run `python3 .github/scripts/build_games_registry.py` to validate and generate
ignored `_data/games.json` for Jekyll. Do not rewrite the authored catalogue
fragment or stage generated JSON. CI builds the catalogue in the Pages artifact
job without auto-commits or navigation injection.

Normal projects outside the standalone game directories instead use
`layout: project` with body content only, head elements in the `head` front matter
literal, and body attributes in `body_attributes`. They inherit the sole header
from `_includes/nav.html`, links from `_data/navigation.yml`, and dedicated shared
header CSS/JavaScript. Never nest a full HTML document inside a layout.
