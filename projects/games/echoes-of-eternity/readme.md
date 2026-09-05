# Echoes of Eternity

Echoes of Eternity is now a static browser game designed to run directly from this repository on GitHub Pages.

## Hosting model

- No backend server
- No database
- No npm build step
- Persistent best score and echo trails stored in `localStorage`

## Files

- `projects/games/echoes-of-eternity/index.html`
- `projects/games/echoes-of-eternity/style.css`
- `projects/games/echoes-of-eternity/main.js`
- `projects/games/echoes-of-eternity/index.v2.html` - Alternate standalone prototype using CDN-loaded Three.js, Matter.js, TensorFlow.js, Tone.js, and Simplex Noise.

`index.html` is the GitHub Pages game linked from the games hub. `index.v2.html` is an experimental alternate version and is not the hub entrypoint.

## Controls

- `W` / `S` or `↑` / `↓` to steer
- `Space` or mouse hold to boost
- On mobile, use the on-screen `↑` / `↓` buttons to steer and `BOOST` to surge
- On touch devices, you can also drag on the playfield to line up your route without boosting
- `Enter` to restart after a collapse
