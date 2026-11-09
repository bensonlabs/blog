# Blog: instructions for AI agents

<!-- Only the governance blocks below come from architectureOS; /sync-governance updates them. Everything outside them belongs to this project and is never changed by a sync. -->

<!-- BEGIN governance:scaffold -->
## How this file works

- **Personal preferences** of the person you're working with come from their own Claude settings
  (their user-level `~/.claude/CLAUDE.md`), never from this file.
- **Core rules** and **conventions** (the next two blocks) come from the architectureOS repo and are
  the same in every project built from it. To change one, change it there (core rule 12).
- **Core rules not used here** (in the project rules) lists any core rule this project can't use,
  with the reason. Skip only those, and only while the reason holds. A rule that seems not to fit
  but isn't listed still applies: ask the person rather than skip it.
- **Project rules** (at the bottom) belong to this project. Write each one in three parts: when it
  fires (a table of triggers), how to do it (files, commands), and a decision shortcut for the
  usual edge cases. Give non-obvious rules a date and who decided ("owner decision, 2026-11-07").
- **Background:** each rule names a doc in the architectureOS repo (`source_repo` in
  `.governance-sync.json`). It's private; read a doc with
  `gh api repos/<owner>/<repo>/contents/docs/<name>.md -H "Accept: application/vnd.github.raw"`.
<!-- END governance:scaffold -->

<!-- BEGIN governance:core-rules -->
## Core rules

### 1. Check what exists before building new surface

- **Fires on:** a new page or route, screen, top-level command, permission or role, or menu entry.
  **Not on:** a bug fix, a refactor, or a column, filter or action on an existing page.
- **Do:** run the `feature-fit` skill before building. Write down the need, search what already
  exists, show the person a fit matrix and a verdict (use as-is, extend, or new), and save a
  one-page note in `docs/feature-fit/` that names what it adds. The person decides. Two reminders
  catch what you miss: one while you write, one at push (what counts is set in
  `.claude/hooks/reminders.config.json`).
- **Shortcut:** people can already do it in a few steps → document how, don't build. It's an
  existing page's job with one more column, filter or action → extend that page. Otherwise build
  new, and say why in one sentence.
- Doc: `check-before-building.md`.

### 2. Docs change in the same commit as the code they describe

- **Fires on:** a change to what people do or see, a business rule, a permission, an endpoint, a
  data field, or a tracked status.
- **Do:** update the help, starter doc, ledger or decision record that describes it in the same
  commit, so undoing the commit undoes both. If nothing needs updating, say so with a line in the
  commit message: `Docs-Impact: none - <why>`.
- Doc: `same-commit.md`.

### 3. Answer a reminder with a reason a reviewer can read

- **Fires on:** a reminder (a hook, a check, a skill step) that applies to your change, when you
  decide no action is needed.
- **Do:** add a line at the end of the commit message, `<Check>: none - <reason>`, for example
  `Feature-Fit: none - settings screen, not a new feature` or `Docs-Impact: none - styling only`.
  Write the reason for a reviewer. Never skip hooks (`--no-verify`) instead.
- Doc: `commit-trailers.md`.

### 4. Cite where behavior comes from

- **Fires on:** code that implements a requirement from somewhere else: a spec, an issue, a system
  being replaced, a person's decision.
- **Do:** name the source in a comment next to it: `// Source: <reference>` (a spec section, an
  issue, `oldapp/orders.py:120-140`, "owner decision, 2026-11-04"). A file that ports one source
  file says so at the top: `// Source-File: <path>`.
- Doc: `provenance-markers.md`.

### 5. Don't invent rules

- **Fires on:** adding a validation, a permission check, a status rule, a limit or a default.
- **Do:** every one traces to a source (rule 4). If one is genuinely needed but has no source, mark
  it `// invented: <why>` and list it in the PR for a person to approve. Before changing code to
  match a doc, check the doc against the source: docs go stale.
- Doc: `no-invented-rules.md`.

### 6. Trust order when sources disagree

The source itself (the running system, the spec, the authoritative data file) wins, then current
code, then docs and ledgers, then memory of past sessions. Fix the lower one to match the higher
one. Fix stale docs you come across while working in that area, in the same commit; don't start a
mass rewrite. Before recommending a file, function or flag you remember, check it still exists.
Doc: `trust-order.md`.

### 7. Record non-obvious decisions

- **Fires on:** a choice a reasonable person could have made the other way, one that is expensive
  to reverse, or one that makes code look surprising.
- **Do:** add `docs/decisions/NNNN-<slug>.md` from `docs/decisions/TEMPLATE.md`. Reversing a
  decision means a new record that supersedes the old one; never edit the old one.
- Doc: `decision-records.md`.

### 8. Analyze code structure with a parser, not text matching

- **Fires on:** a script, audit or codemod that decides something from code structure (what calls
  what, which attributes a class has, which routes exist).
- **Do:** use the language's parser or compiler API (TypeScript compiler API, Roslyn, Python
  `ast`). Regex and string search are fine for logs, prose, non-code files, reminders that only
  nudge, and narrowing down which files to parse, never for the final decision.
- Doc: `analyze-with-a-parser.md`.

### 9. Access is enforced on the server, and widened only with a source

- **Fires on:** a permission check, a role, a sharing or visibility rule, an endpoint that reads or
  changes data, or anything else that changes who can see or do what.
- **Do:**
  - Check access on the server, against the stored record (whose it is, who it's shared with),
    never against an ID, role or owner sent in the request. Checks in the browser only decide what
    to show.
  - Never run SQL or a query built from request text: accept IDs and structured filters.
  - Widening access (more people, more records, fewer checks) cites its source (rule 4) and is
    listed in the PR for the owner to approve. Never undo a security fix to make something work.
- Doc: `access-on-the-server.md`.

### 10. Report each work state as its own fact

- **Fires on:** saying where a change stands: in a report, a PR, a handoff note, an issue.
- **Do:** keep the states apart: **implemented** (the change exists), **verified** (the stated
  check ran and passed, and you saw the result), **accepted** (the person approved it), **merged**
  (it's on the target branch), **released** (users or the target environment have it). Never infer
  a later state from an earlier one: a passing build isn't a release, and a check that didn't run
  didn't pass.
- Doc: `work-states.md`.

### 11. Protect user data before changing it destructively

- **Fires on:** a migration, bulk edit, import, cleanup, or anything else that deletes or rewrites
  data people created.
- **Do:** export it first, check the export is complete, and prove the restore works somewhere
  disposable. Check inputs before changing anything, and make the change all-or-nothing so a
  failure leaves no partial state. Ask the person before running it on real data.
- Doc: `user-data-safety.md`.

### 12. Keep governance in step with architectureOS

Run `/sync-governance` now and then; it updates the governance blocks, skills, hooks and
templates. To improve a core rule, a skill or a template, change it in the architectureOS repo so
every project gets it, not only here. Doc: `keeping-projects-in-sync.md`.
<!-- END governance:core-rules -->

<!-- BEGIN governance:conventions -->
## Conventions

- **Every project states its lifecycle stage**: experiment, project, maintained, product or
  archived (in the project rules and the README). An experiment is labeled as one and makes no
  production claims. Moving up a stage is a decision the person makes, not a reward for
  accumulating code; a stage brings only the controls its risk needs.
- **Boring, replaceable technology.** Prefer what the next person can understand, run and replace.
  No shared infrastructure, service or library until a second real user of it exists. Settle who
  owns a piece of data or behavior before splitting it into another service or repo.
- **Every repo's README** says what the repo owns, its lifecycle stage, how to run or use it, and
  where its guidance lives.
- **Small, reversible steps.** Prefer a reviewable increment with a way back over a sweeping
  change; keep existing users of a thing working until its replacement is proven.
- **Never start or re-run a deploy or CI workflow** without an explicit go for that run. When asked
  whether something is reachable or allowed, check with read-only calls and run nothing.
- **Test data in a sandbox** (an environment the project rules name as safe for testing) is fine
  without asking: label test records TEST, and say afterwards what was done. Anything shared or
  live goes through the person first.
- **People's data stays where it lives.** Users' personal data never goes into commits, PR
  descriptions, issues, logs, test data or screenshots, nor into any service the project doesn't
  already trust with it. Logs mask identifying values.
- **Secrets never go in git.** Passwords, keys, tokens and connection strings stay in the
  environment or a secrets store; committed config holds placeholders. If one is committed, tell
  the person at once: rotating it matters more than rewriting history.
- **Sample data is invented.** Mockups, demo data and fixtures use made-up people and places,
  checked against real records for accidental matches.

Doc (where each convention came from): `conventions.md`.
<!-- END governance:conventions -->

## Project rules

### About this project

- What it owns: bensonlabs.org itself. The blog posts, About, the site header and layouts, and the
  build and deploy of the whole site (GitHub Pages, from `master`). Everything under `/projects/`
  comes from bensonlabs/projects and bensonlabs/games, and `/bootstraps/` from bensonlabs/bootstraps,
  as pinned releases ("components"); this repo assembles them and never edits them
  (CONTRIBUTING.md, "Headers, project pages, and components").
- Lifecycle stage (experiment, project, maintained, product, archived): maintained. A personal
  site with one user, Justin; the hub that deploys the whole site since 2026-11-07 (ADRs 1 to 5).

### Core rules not used here

- 4 (cite where behavior comes from): the posts and pages implement no outside spec.
- 5 (don't invent rules): the site's limits and defaults are design choices, not rules that need a source.
- 9 (access on the server): a static site; there is no server.
- 11 (protect user data): the blog keeps no visitor data.

Listed 2026-11-08 (Justin's choice of how rules fit a project; architectureOS ADR 5).

### Site rules

| When | Do |
|---|---|
| Adding, changing or removing a post | Use the `add-post` skill; it pushes straight to `master` and the site deploys by itself (owner decision, 2026-11-07). |
| Anything under `/projects/` (a game, a project, a workout plan) or the Bootstraps page | Change it in bensonlabs/games, bensonlabs/projects or bensonlabs/bootstraps (`site/index.md`), never here: those folders are assembled from pinned releases and ignored by git. |
| 2ndPaste's and Tracro's support and privacy pages | Their URLs are registered in App Store Connect: `/projects/2ndPaste/`, `/projects/2ndPaste/privacy.html`, `/projects/tracro/`, `/projects/tracro/privacy.html`. Never move, rename or drop them; the page check refuses a release without them. |
| The site header | `_includes/nav.html` is its only markup and `_data/navigation.yml` its only list of links; the page check requires the same links on every normal page. |
| The pipeline (`.github/workflows/`, `.github/scripts/`) | A PR, checked by the "Rendered pages" workflow (page check and actionlint); merge when green (owner decision, 2026-11-08). Keep one deploy definition, `jekyll.yml` (ADR 4). |

Shortcut: anything a visitor sees under `/projects/` is fixed in its own repo; the rest is fixed here.

### Commands

- Install: nothing for the checks (Python 3 only). A full local build needs Ruby and Jekyll
  (CONTRIBUTING.md, "Viewing Your Site Locally"); without them, the PR check builds it.
- Run locally: `python3 .github/scripts/components.py assemble` (`py` instead of `python3` on
  Windows) puts the pinned releases in place; then `bundle exec jekyll serve` if Jekyll is installed.
- Tests, type check, lint (wrap-up runs these): `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`;
  after a Jekyll build, `bash .github/scripts/check-nav.sh _site`. The PR check also runs actionlint.
  `test_docs.py` fails when a doc cites a repo path that doesn't exist: fix the doc in the same commit.
- Push reminder, once per clone: `node .claude/hooks/push-reminder.mjs --install`

### Environments

- Sandbox for testing: a PR. Its "Rendered pages" check builds the whole site with the pinned
  releases and checks it; there is no shared test site.
- Live, and who changes it: bensonlabs.org, deployed from `master` by `jekyll.yml` on every push,
  and by Update components when a component publishes a release (CONTRIBUTING.md, ADRs 2 and 4).

### Branches, review and release

- PRs go to (target branch): `master`. Posts go straight to `master`; the pipeline and layouts go
  through a PR.
- Branch names (default `feature/<short-name>`): the default.
- Bring a branch up to date by (merge or rebase): merge.
- Reviewer: with no second reviewer, the person reviews the whole diff themselves before it merges.
- How changes reach users, and who runs it: nobody runs anything. A push to `master` deploys; a new
  component release is pinned and deployed by the Update components workflow, which also runs daily
  and repairs a deploy that failed (ADR 4).

### Where things live (feature-fit searches these)

- Pages and navigation: posts in `_posts/`, About in `about.md`, the home page in `index.html`;
  the header in `_includes/nav.html` with its links in `_data/navigation.yml`; layouts in
  `_layouts/`. `/projects/` comes from the components.
- Help or user docs: `README.md`, `CONTRIBUTING.md`.
- Starter docs: none yet.
- API endpoints: none; a static site.

### Commit-message answers this project uses

- `Feature-Fit: none - <reason>` and `Docs-Impact: none - <reason>` (core rules 1 to 3). Add any of
  the project's own here, with the check that reads them.
