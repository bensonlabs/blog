# Copilot / agent instructions for bensonlabs/blog

This repo is a Jekyll site (GitHub Pages, stock `jekyll-build-pages`, safe mode)
plus a set of standalone browser apps under `projects/`. Follow these rules when
adding or editing content. They exist to keep navigation unified across the site.

## Navigation: one source of truth

- Site nav links live in exactly ONE file: `_data/navigation.yml`.
  To add a page to the nav, add an entry there. Do not hardcode nav anywhere else.
- Nav markup for Jekyll-rendered pages lives in `_includes/nav.html`.
- Never add per-page or per-layout `<nav>` blocks. Never reintroduce
  "← back to blog" links; the shared nav replaces them.

## Page types and how they get nav

- Blog posts: front matter `layout: post`. Nav is inherited. Nothing to add.
- Jekyll pages (Markdown/HTML fragments): `layout: default`. Nav inherited.
- Standalone apps under `projects/` (full HTML documents with their own
  `<head>`/`<body>`): these are NOT processed into the blog layout. Paste the
  shared nav snippet from `_includes/nav-inject.html` immediately after `<body>`.
  Keep it byte-identical to the canonical snippet.

## Games and full-screen apps

- For any game or full-screen interactive, add `class="nav-autohide"` to its
  `<body>`. This hides the nav until the cursor reaches the top edge.
- Do not apply `nav-autohide` to the blog, projects hub, or workouts.

## Theme

- Palette is Obsidian dark: bg #1e1e1e, surface #252525, card #2d2d2d,
  border #3a3a3a, text #dcddde, muted #888, accent #7c3aed, accent2 #a78bfa.
- Do not introduce new nav colors. The nav owns its palette in the snippet/include.
- Emoji on game cards are intentional. Do not replace them with icons or images.

## Do not

- Do not hardcode navigation into individual pages.
- Do not edit the nav markup inside an app body except to paste the canonical snippet.
- Do not add Jekyll plugins (GitHub Pages safe mode will reject them).
