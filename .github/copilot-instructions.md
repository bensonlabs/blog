# Copilot / agent instructions for bensonlabs/blog

This is a GitHub Pages Jekyll site in safe mode. Do not add unsupported plugins.
Emoji on catalogue cards are intentional; preserve their ordering and presentation.

## Headers, project pages, and standalone games

`_includes/nav.html` is the only site-header markup source; `_data/navigation.yml`
is the only source of its links. Header styling and behavior live in
`assets/css/header.css` and `assets/js/header.js`.

Blog pages inherit `default → base`; posts inherit `post → default → base`.
Normal project pages use `layout: project` (which inherits `base`) and contain
only body content after front matter. Preserve their original head elements in
the YAML `head: |` literal (metadata, CSP, fonts, styles, scripts), and any body
attributes in `body_attributes`. The project layout adds no content-width wrapper.
Never put a complete HTML document inside a layout. Keep Workouts' Liquid raw
blocks and JavaScript template placeholders intact.

Games at `projects/games/<slug>/` are complete standalone documents without front
matter, a site header, copied snippets, canonical markers, or auto-hide code.
Their controls, body layout, fullscreen, audio, and storage belong to the game;
no corner needs to be reserved for a site menu. Game-owned navigation and an
optional back-to-games link are fine. Choose CSP for the game's own assets.

Run `python3 .github/scripts/build_games_registry.py` **before** Jekyll. It validates
authored metadata and creates ignored `_data/games.json`; the catalogue fragment
reads that data without changing its presentation. Neither the generator nor CI
edits game files or commits generated catalogue data. The Pages job generates
this data in the same build that renders and uploads the site.

See `.github/scripts/GAME_METADATA.md` for metadata precedence and fallbacks.
For Dungeon Crawler, edit `game.json` for the catalogue and `index.source.html`
for the Vite shell; keep the existing Vite input, base path, and hashed assets.
Its unrelated `metadata.json` is not catalogue input. After `npm ci && npm run build`
in its directory, copy `dist/assets` to `assets` and `dist/index.source.html` to
`index.html`, without injecting anything. Treat `index.html` as generated output.

Validate with `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`,
`python3 .github/scripts/check_dungeon_build.py`, and, after Jekyll,
`bash .github/scripts/check-nav.sh _site`. The last check is read-only and checks
rendered normal pages; it never requires a site header inside a game.

AI Trending's generator writes `latest/index.html` and a dated `YYYY-MM-DD/index.html`
fragment. The root `projects/ai-trending/index.html` stays a redirect to `latest/`.
