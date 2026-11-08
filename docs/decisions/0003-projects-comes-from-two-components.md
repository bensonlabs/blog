# ADR 3: Everything under /projects/ comes from two components

**Date:** 2026-11-07
**Status:** accepted (refines ADR 1's list of components). ADR 5 moved Bootstraps out of /projects/.

## Context

Justin wants anything in the site menu to be added in one step (2026-11-07). The games came from
bensonlabs/games, the workout plans from bensonlabs/workouts, and the other project pages and the
Bootstraps post lived here.

## Decision

- bensonlabs/projects owns /projects/ except the games: the Projects page, each project, Workouts
  and Bootstraps, with cards built from each item (its ADR 2). This repo pins it as the `projects`
  component and wraps the pages its release lists.
- bensonlabs/games keeps the games and their catalogue, pinned as the `games` component in
  /projects/games/, inside the projects folder. Components may nest: the outer one is placed
  first, and its release may not contain anything in the inner one's folder.
- The Bootstraps post moved to bensonlabs/projects as the first guide; /bootstraps/ redirects to
  it and the menu link points to /projects/bootstraps/. Justin's workout plan moved to
  /projects/workouts/justin/.
- Posts and About stay here, added with the add-post skill.

## Alternatives considered

- One repo for all of /projects/, games included (bensonlabs/games renamed to
  bensonlabs/projects): rejected by Justin (2026-11-07); games keep their own repo.

## Consequences

- This repo no longer holds anything under projects/; that folder is filled at build time.
- Both repos start the Update components workflow after each release (ADR 2), with the same
  BLOG_DISPATCH_TOKEN secret.
- 2ndPaste's and Tracro's support and privacy pages kept their addresses, which are registered in
  App Store Connect; the page check requires them.
- bensonlabs/workouts is archived.

Corrected 2026-11-07: the first text of this record (merged in PR #71) described the one-repo plan,
with games renamed into bensonlabs/projects, although what was built and merged is the two
components above.
