# ADR 4: Update components deploys inside its own run, and repairs a site that's behind

**Date:** 2026-11-08
**Status:** accepted (changes how ADR 2's runs deploy; ADR 2 stands)

## Context

The site review on 2026-11-08 found three ways the automatic path could fail silently or stall:

- Update components committed the pin and then only *started* the deploy workflow, so its own run
  was green even when the deploy failed. The next daily run saw the pin already committed and did
  nothing, so the site stayed on the old release until the next push to master.
- A run queued behind another one checked out master as it was when it was queued, before the
  first run's pin, so its push was rejected and that release waited a day.
- One component whose release couldn't be read stopped the daily run for the other one too.

Justin approved fixing them the same morning, with merges to happen without him once the checks
pass, so the path has to report and repair its own failures.

## Decision

- Update components has four jobs:
  - **look** (read-only): reads master as it is at run start and looks for new releases.
  - **pin** (the only job that can push): builds and checks the whole site with the new pins,
    then commits them, putting them on top of master if it moved.
  - **deploy**: runs `jekyll.yml` inside the same run (`workflow_call`), so a failed deploy turns
    the Update components run red.
  - **report**: turns the run red when a component wasn't updated, after the others were.
- The deploy publishes the commit it built as `/deployed-commit.txt`. Each run compares it with
  master and deploys master again when they differ, so a deploy that failed is repaired by the
  next run, the daily one at the latest.
- There is still one deploy definition: pushes, manual runs and Update components all run
  `jekyll.yml`.

## Alternatives considered

- Keep starting the deploy with `gh workflow run` and wait for that run: it needs the run's id,
  which `gh workflow run` doesn't return, and it keeps Actions write in the job.
- Deploy straight from Update components with its own steps: a second deploy path to keep in step
  with `jekyll.yml`, for about 25 s saved per release.
- Ask GitHub's deployments API whether the last deploy succeeded: deployments made inside
  Update components are recorded against the commit the run started from, not the one deployed,
  so the answer would be wrong after every pin.

## Consequences

- A failed deploy after a pin shows as a red Update components run, and GitHub emails Justin.
- The site is never behind master for more than a day, even after a failed deploy.
- A release builds the site twice (once to check before the pin, once to deploy); about 25 s.
- `/deployed-commit.txt` is public; it holds only a commit id of this public repo.
