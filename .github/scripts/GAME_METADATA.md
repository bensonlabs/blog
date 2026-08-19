# Game metadata block

Preferred: every file at `projects/games/<slug>/index.html` should carry one
HTML comment, placed anywhere in `<head>` (immediately after the CSP meta tag
is a good spot):

```html
<!-- bl-game-meta
title: Neon Drift
emoji: 🚀
order: 70
description: Survive as long as possible in the Neon Drift Zone. Your ship auto-accelerates — manage momentum, drift through tight formations, and graze obstacles to multiply your score. Made by Nemotron 3 Ultra 550b A55b in OpenCat on iOS.
-->
```

Fields:

- `title` — display name on the games grid card.
- `emoji` — single emoji used as the card icon.
- `order` — integer controlling sort position on the grid (lower first). Leave
  gaps (10, 20, 30...) so new games can be inserted without renumbering
  everything.
- `description` — one line, shown on the card. Convention: end with
  `Made by <model> in <tool> on <hardware>.` when the game was built
  agentically, so the grid doubles as a model-capability benchmark log.

The card's link path is always derived from the directory name
(`/projects/games/<slug>/`) — it is not authored by hand, so it can't drift
out of sync with the actual folder.

Deterministic fallback behavior (for drop-in intake):

- If the `bl-game-meta` block is missing, CI still builds a card using:
  - `title`: `<title>` tag, else slug title-cased.
  - `description`: `<meta name="description" content="...">`, else
    `Browser game: <title>.`
  - `emoji`: `🎮`
  - `order`: `999`
- If the block exists but omits some fields, missing fields use the same
  fallback rules above.
- `order` must be parseable as an integer when present.
- Unknown lines inside the metadata block still fail validation, so typos are
  caught deterministically.

`.github/scripts/build_games_registry.py` reads this block from every game
directory and regenerates the `GAMES` array in `projects/games/index.html`.
Do not hand-edit that array — edit the metadata block in the game's own
`index.html` instead and let CI regenerate the listing.
