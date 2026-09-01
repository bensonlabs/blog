<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Mythic Dungeon Crawler

React and TypeScript roguelike built with Vite. It is deployed as a static game at `/projects/games/dungeon-crawler/`.

## Run Locally

Prerequisite: Node.js 22 or later.

```bash
npm ci
npm run dev
```

## Build and Deploy

```bash
npm run build
```

Vite uses `index.source.html` as its source entrypoint and emits `dist/index.source.html` plus hashed assets. The GitHub Pages workflow builds the game, publishes the generated assets and `index.html` into the deployment artifact, then runs Jekyll. Do not manually edit the generated root `index.html`; update `index.source.html` instead.

`GEMINI_API_KEY` is only needed for Gemini API features. Copy `.env.example` to a local `.env` file if those features are enabled; never commit the key.
