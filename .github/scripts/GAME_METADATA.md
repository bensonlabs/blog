# Game catalogue metadata

The read-only generator `.github/scripts/build_games_registry.py` creates ignored
`_data/games.json`. Run it before Jekyll; `projects/games/index.html` is an authored
layout-backed catalogue fragment that consumes this data. Never stage the JSON
or rewrite individual games to register them. Pages generates the catalogue in
its own build; deployment does not depend on bot commits.

## Authored sources and precedence

Each immediate game directory with `index.html`, `index.source.html`, or `game.json`
is discovered once. Sources, in order of precedence:

1. `game.json`: a JSON object with the fields below. This replaces the metadata
   comment as a whole, rather than merging two authored blocks.
2. Without a sidecar, a `bl-game-meta` comment in `index.source.html`, if that
   authored compiled entrypoint exists.
3. Otherwise, a `bl-game-meta` comment in the standalone `index.html`.

If `index.source.html` exists, its HTML supplies fallback title/description even
when a sidecar overrides its metadata. A sidecar without an authored HTML source
uses slug-based fallbacks. Generated `index.html` is never read for a sidecar game.
`metadata.json` is unrelated and is never read. Dungeon Crawler uses `game.json`;
its legacy source comment remains for compatibility, but the sidecar wins.

```html
<!-- bl-game-meta
title: Neon Drift
emoji: 🚀
order: 70
description: Survive the Neon Drift Zone. Made by <model> in <tool> on <hardware>.
-->
```

Equivalent compiled-game `game.json`:

```json
{
  "title": "Neon Drift",
  "emoji": "🚀",
  "order": 70,
  "description": "Survive the Neon Drift Zone."
}
```

`title`, `emoji`, and `description` are strings. `order` is an integer (an integer
string is accepted for legacy comments). Lower orders appear first; ties sort by
title, then retain sorted directory discovery order. Equal titles/orders across
games are permitted. Paths always derive from the directory name.

Missing or empty fields preserve the initial fallback behavior: title from the
HTML title with the Benson Labs suffix removed, else title-cased slug;
description from its meta description, else `Browser game: <title>.`; emoji `🎮`;
order `999`. Missing comments are allowed with a notice. Unknown fields/lines,
duplicate comment blocks or field names, malformed JSON/comments, non-string
text fields, null values in JSON, and non-integer orders fail validation. An
ignored legacy source comment is still checked for malformed/duplicate syntax.

Games are standalone documents with no front matter or shared header. Do not add
snippets, canonical markers, auto-hide scripts, or space for a site menu button.
Game controls, navigation, audio, fullscreen, and saved state remain game-owned.
