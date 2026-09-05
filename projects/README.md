# Projects

A collection of interactive projects and tools built for bensonlabs.org.

## Projects

- **[gravitas](/projects/gravitas/)** - High-fidelity N-body gravity simulator with real-time orbital projection, procedural ambient audio, and a glassmorphic telemetry dashboard.  Vibed by Gemini in Antigravity IDE.
- **[focus-lab](/projects/focus-lab/)** - Premium productivity dashboard with Pomodoro timer, focus tasks, synthesized ambient sounds, and weekly metrics. Vibed in Gemini CLI
- **[ai-trending](/projects/ai-trending/)** - Daily analysis of trending AI/ML repositories on GitHub with ranked results, category filtering, and repository scoring.
- **[games](/projects/games/)** - A growing collection of browser-based games. The generated games hub is the current catalogue.
- **[to-do-app](/projects/to-do-app/)** - Full-stack todo app backed by Neon Postgres + Render. [Live demo](https://todo-app-l3m0.onrender.com). Vibed by Qwen3.6-35B-A3-NVFP4 in zed IDE on DGX-Spark.
- **[context-console](/projects/context-console/)** - Owner-only work context tracker. Phase 1 is deployed and smoke-tested on [Render](https://context-console.onrender.com), backed by Supabase project `buvlsrccvrnnbxtwiozn`, with source at [bensonlabs/context-console](https://github.com/bensonlabs/context-console).
- **[workouts](/projects/workouts/)** - Workout tracking and exercise routines. Vibed by Claude Chat + Claude Code.

## Games

- **[2048](/projects/games/2048/)** - Classic tile-merging puzzle game with undo, score tracking, and mobile support. Vibed by Copilot in the iOS Github app.
- **[not-Wordle](/projects/games/not-wordle/)** - 5-letter word guessing game with statistics tracking. Vibed by Copilot in the iOS Github app.
- **[brick-break](/projects/games/breakout/)** - Classic brick-breaker with 3 difficulty levels and high-score tracking. Vibed by Copilot in the iOS Github app.
- **[NeoSweep XZ9](/projects/games/neo-sweep/)** - Uncover a neon grid without triggering mines and manage limited scans.
- **[Orbit Bloom](/projects/games/orbit-bloom/)** - Harvest glowing motes as your shield and survive an ever-faster comet swarm. Vibed by gpt-5.4-mini in Hermes.
- **[The Last Signal](/projects/games/last-signal/)** - Text-based sci-fi adventure with three acts and two endings. Vibed by Qwen3.6-35B-A3-NVFP4 in zed IDE on DGX-Spark.
- **[Ethereal Wardens](/projects/games/ethereal-wardens/)** - Position wardens to repel waves of enemies in a minimalist tower-defense game.
- **[LumenTrace](/projects/games/lumen-trace/)** - Neon sliding-block puzzle where you trace charged paths through the grid without getting trapped.
- **[Neon Drift](/projects/games/neon-drift/)** - Manage an auto-accelerating ship, drift through formations, and graze obstacles for score multipliers.
- **[Gravity Glyphs](/projects/games/gravity-glyphs/)** - Manipulate gravity and chain glowing glyph effects in a WebAssembly arcade puzzle.
- **[Echoes of Eternity](/projects/games/echoes-of-eternity/)** - Static sci-fi survival runner with persistent echo trails and local-only saves.
- **[Murmuration](/projects/games/murmuration/)** - Guide a living flock through moonlit weather and bring every bird home to its matching roost.
- **[Parcel Panic](/projects/games/parcel-panic/)** - Sort a runaway stream of parcels into matching chutes, build combos, and keep the depot moving before the shelves jam.
- **[Parcel Panic v2](/projects/games/parcel-panic-v2/)** - Sort Sparky's dog icons into matching chutes, build combos, and keep the depot moving before the shelves jam.
- **[Pac-Kour](/projects/games/pac-kour/)** - Sprint, wall-jump, and clear every pellet in a compact platforming maze where momentum matters as much as route planning.
- **[Marble Tilt](/projects/games/marble-tilt/)** - Guide a steel marble through a tilt-controlled wooden maze, avoid pit hazards, and reach the goal.
- **[VOIDFALL](/projects/games/space-shooter/)** - Survive deep-space arcade waves, collect power-ups, and confront the VOIDLORD boss.
- **[Driftline](/projects/games/driftline/)** - Cast a lure to steer through a dark ocean trench, collect plankton to replenish your light, and evade predators. Made by Opus 5.
- **[ECHO/SHIFT](/projects/games/echo-shift/)** - Time-loop action puzzle where previous attempts become allies. Made by GPT-6 Astra.
- **[Mythic Dungeon Crawler](/projects/games/dungeon-crawler/)** - Dark-fantasy roguelike with procedural labyrinths, real-time combat, spells, and Web Audio.
- **[Parkour World](/projects/games/parkour-world/)** - High-octane 2D vector momentum platformer with wall-running, flow states, procedural skyline districts, and synthesized audio.
- **[Roof & Root](/projects/games/root-and-root/)** - Catch rain on awnings, water thirsty pots, and tend seven rooftop gardens. Made by GPT-6 Astra.
- **[Sparky's Run](/projects/games/sparkys-run/)** - Browser puzzle game about navigating narrowing routes.
- **[WISPR](/projects/games/wispr/)** - Ethereal 3D inertia-parkour across floating crystal slabs.

## Contributing

All new interactive projects and tools should be created in the `projects/` directory and linked from this README. For games, author a `bl-game-meta` comment or compiled-game `game.json` and run `python3 .github/scripts/build_games_registry.py`; `_data/games.json` is an ignored build artifact.

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
