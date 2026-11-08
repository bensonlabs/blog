# ADR 1: Assemble the site's components from pinned releases

**Date:** 2026-11-07
**Status:** accepted; ADR 3 replaced its list of components

## Context

This repo used to hold everything on bensonlabs.org. The 25 games lived in
`projects/games/`, so every deploy carried npm tooling for one of them, the blog
got Dependabot security PRs for packages it never used, and the site published
16 MB of oversized images plus the games' source and tooling files. The workout
plans had already moved to bensonlabs/workouts, but the deploy checked out that
repo's `main`: any change there went live on the next blog deploy without a
deliberate step, and the PR check didn't fetch the plans, so every PR failed it
from October 25 until #68. Justin decided (2026-11-07) to break the blog into
components, each owning its part of the site, done best-practice wise.

## Decision

A component is a part of the site that another repository owns and publishes
as a GitHub release: one `.tar.gz` holding its files exactly as the site serves
them, plus a `.sha256` file. This repo pins each component by version and
sha256 in `_data/components.json`. Before every Jekyll build (the PR check, the
deploy and local previews alike), `.github/scripts/components.py assemble`
downloads each pinned release, refuses it if its sha256 differs, unpacks it at
the component's old address (nothing may land outside its folder), and wraps
the pages the entry lists in the `project` layout. Component folders are ignored
by git. `components.py bump <name> <version>` pins a new release.

The first components are bensonlabs/games (`/projects/games/`, which owns the
catalogue too) and bensonlabs/workouts (`/projects/workouts/`). Focus Lab stays
here as a frozen page: it has no source to build. The archived
bensonlabs/ai-trending holds the dashboard generator; its pages stay here.

## Alternatives considered

- Check out each component's `main` at deploy time, as workouts did: no review
  point before a change goes live, and a deploy can't be reproduced later.
- Each repo publishes its own GitHub Pages site under bensonlabs.org: every
  address changes to `/<repo-name>/`, the shared header and catalogue are lost,
  and old links need redirects.
- Keep the games here and only tidy them: the blog would keep carrying another
  project's build tools, dependencies and release rhythm.

## Consequences

- A component change reaches the site in two steps: a release in its repo, then
  a one-line pin change here, reviewed and checked like any PR.
- What the site serves can be rebuilt exactly from this repo's history: the pins
  name exact files, and the releases are reproducible.
- The PR check and the deploy run the same assembly, so they can't drift apart
  again.
- Component folders must never be committed here; `assemble` refuses to replace
  a folder that holds committed files.
- A wrapped page's body still goes through Liquid, so components keep their own
  `{% raw %}` blocks where they need them.
