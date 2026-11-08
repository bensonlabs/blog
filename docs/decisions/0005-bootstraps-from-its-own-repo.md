# ADR 5: Bootstraps at /bootstraps/, published from bensonlabs/bootstraps

**Date:** 2026-11-08
**Status:** accepted (changes ADR 3's Bootstraps part; the rest of ADR 3 stands)

## Context

The Bootstraps page exists to be typed and clicked as little as possible: on a fresh machine,
Justin types bensonlabs.org/bootstraps and copies a command. After ADR 3 that address redirected to
one guide, and the menu's Bootstraps link opened a section page with a single "Workstations" tile
to click through. Justin wants the address to land on every bootstrap at once (2026-11-08).

## Decision

- The page is a third component, `bootstraps`, published from bensonlabs/bootstraps (the repo with
  the scripts it runs) and placed at `/bootstraps/`. Justin chose this over keeping the page in
  bensonlabs/projects, so a script and its command change in the same pull request.
- Its release is the same reproducible pack and Release workflow as games and projects (shared
  files, marked). Its page is an `index.md` that Jekyll renders with the post layout, so nothing
  is wrapped.
- A component's folder may now be `projects/` or `bootstraps/` (`COMPONENT_FOLDERS`); the blog's
  own `/bootstraps/` redirect page is gone.
- The menu's Bootstraps link is `/bootstraps/`, the posts link straight to its sections, and the
  old `/projects/bootstraps/` pages redirect there, keeping the #section.

## Alternatives considered

- One page in bensonlabs/projects (`/projects/bootstraps/` as the guide itself, with
  `/bootstraps/` redirecting to it): fewer moving parts, but the address bar ends at
  `/projects/bootstraps/` and the page stays apart from its scripts.
- The page back in this repo: no new component, but the menu's sections would come from three
  places with no add skill for this one.

## Consequences

- bensonlabs/bootstraps needs `BLOG_DISPATCH_TOKEN` to have its releases pinned within minutes;
  without it they go live at the daily Update components run.
- That repo publishes GitHub releases for the page only (`vX.Y.Z`); its grader keeps tags.
