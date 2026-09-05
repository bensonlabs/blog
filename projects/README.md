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
- **[Orbit Bloom](/projects/games/orbit-bloom/)** - Harvest glowing motes as your shield and survive an ever-faster comet swarm. Vibed by gpt-5.4-mini in Hermes.
- **[The Last Signal](/projects/games/last-signal/)** - Text-based sci-fi adventure with three acts and two endings. Vibed by Qwen3.6-35B-A3-NVFP4 in zed IDE on DGX-Spark.
- **[LumenTrace](/projects/games/lumen-trace/)** - Neon sliding-block puzzle where you trace charged paths through the grid without getting trapped.
- **[Echoes of Eternity](/projects/games/echoes-of-eternity/)** - Static sci-fi survival runner with persistent echo trails and local-only saves.
- **[Murmuration](/projects/games/murmuration/)** - Guide a living flock through moonlit weather and bring every bird home to its matching roost.
- **[Parcel Panic](/projects/games/parcel-panic/)** - Sort a runaway stream of parcels into matching chutes, build combos, and keep the depot moving before the shelves jam.
- **[Parcel Panic v2](/projects/games/parcel-panic-v2/)** - Sort Sparky's dog icons into matching chutes, build combos, and keep the depot moving before the shelves jam.
- **[Pac-Kour](/projects/games/pac-kour/)** - Sprint, wall-jump, and clear every pellet in a compact platforming maze where momentum matters as much as route planning.
- **[Marble Tilt](/projects/games/marble-tilt/)** - Guide a steel marble through a tilt-controlled wooden maze, avoid pit hazards, and reach the goal.
- **[VOIDFALL](/projects/games/space-shooter/)** - Survive deep-space arcade waves, collect power-ups, and confront the VOIDLORD boss.
- **[Mythic Dungeon Crawler](/projects/games/dungeon-crawler/)** - Dark-fantasy roguelike with procedural labyrinths, real-time combat, spells, and Web Audio.
- **[Parkour World](/projects/games/parkour-world/)** - High-octane 2D vector momentum platformer with wall-running, flow states, procedural skyline districts, and synthesized audio.
- **[Sparky's Run](/projects/games/sparkys-run/)** - Browser puzzle game about navigating narrowing routes.
- **[WISPR](/projects/games/wispr/)** - Ethereal 3D inertia-parkour across floating crystal slabs.

## Contributing

All new interactive projects and tools should be created in the `projects/` directory and linked from this README. For games, add `bl-game-meta` to the game's own `index.html` and run `python3 .github/scripts/build_games_registry.py`; do not manually edit the generated `GAMES` array in `projects/games/index.html`.
