# ADR 2: Pin new component releases automatically, after the checks

**Date:** 2026-11-07
**Status:** accepted (changes how ADR 1's pins are updated; ADR 1 stands). ADR 4 changes how its runs deploy.

## Context

With ADR 1, a new game reached the site only after a release in bensonlabs/games and a pin
change here, each with its own PR: about eight steps. Justin wants adding a game to be
effortless and live within minutes (2026-11-07); he is the site's only user.

## Decision

The Update components workflow pins new releases itself. The games repo's Release workflow
starts it right after publishing (with a fine-grained token that may only run this repo's
workflows); it also runs daily and by hand. It pins the newest release (`components.py update`,
never backwards), builds the whole site with it, runs the page checks, and only then commits
the pin to master and starts the deploy.

## Alternatives considered

- A pin-change PR for each release: a review point, but a PR opened by a workflow gets no
  checks, and every new game would wait for a merge.
- Build from each component's newest release without pinning: no record of what the site
  shows, and no check before a release goes live.

## Consequences

- The checks, not a person, decide whether a release goes live; a failed run leaves the site
  on the previous release and GitHub emails Justin about the failure.
- Pins are still committed, so what the site showed at any time is in this repo's history.
- Pin commits come from github-actions[bot] rather than a PR.
