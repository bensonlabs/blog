# ADR 3: Everything under /projects/ comes from one component

**Date:** 2026-11-08
**Status:** accepted (refines ADR 1's list of components)

## Context

Justin wants anything in the site menu to be added in one step (2026-11-08). The games came from
bensonlabs/games, the workout plans from bensonlabs/workouts, and the other project pages and the
Bootstraps post lived here.

## Decision

- bensonlabs/projects (renamed from games) owns all of /projects/: the Projects page, Games,
  Workouts, Bootstraps and each project, with cards built from each item (its ADR 4). This repo
  pins it as one component and wraps the pages its release lists.
- The Bootstraps post moved there as the first guide; /bootstraps/ redirects to it and the menu
  link points to /projects/bootstraps/. Justin's workout plan moved to /projects/workouts/justin/.
- Posts and About stay here, added with the add-post skill.

## Consequences

- This repo no longer holds anything under projects/; that folder is filled at build time.
- bensonlabs/workouts is archived.
