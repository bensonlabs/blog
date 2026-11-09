# Blog: instructions for AI agents

<!-- Only the governance blocks below come from architectureOS; /sync-governance updates them. Everything outside them belongs to this project and is never changed by a sync. -->

<!-- BEGIN governance:scaffold -->
## How this file works

- **Personal preferences** come from the person's own `~/.claude/CLAUDE.md`, never from this file.
- **Core rules** (the next block) come from the architectureOS repo and are the same in every
  project. To change one, change it there; `/sync-governance` keeps this file in step.
- **Project rules** (at the bottom) belong to this project: what it owns, its commands, what must
  never move, and its own checks. Give a non-obvious one a date and who decided ("owner decision,
  2026-11-07").
- **Apps with users** add the product rules (architectureOS doc `product-rules.md`) to their
  project rules when they reach the "product" stage.
- **Background:** each core rule names a doc in the architectureOS repo (`source_repo` in
  `.governance-sync.json`). It's private; read a doc with
  `gh api repos/<owner>/<repo>/contents/docs/<name>.md -H "Accept: application/vnd.github.raw"`.
<!-- END governance:scaffold -->

<!-- BEGIN governance:core-rules -->
## Core rules

1. **Record decisions that aren't obvious.** A choice someone could reasonably have made the other
   way, or one that's costly to undo, gets `docs/decisions/NNNN-<slug>.md` from `TEMPLATE.md`.
   Reversing one is a new record that supersedes it; the old one gets only a "superseded by" line.
   Doc: `decision-records.md`.
2. **Docs change in the same commit as the code they describe,** so undoing the commit undoes both.
   When code, docs and memory disagree, the source wins (the running system, the spec, the data),
   then the code, then the docs: fix the lower one while you're there.
   Docs: `same-commit.md`, `trust-order.md`.
3. **Report each work state as its own fact:** built, checked (the check ran and passed, and you saw
   it), approved, merged, live. Never infer a later state from an earlier one.
   Doc: `work-states.md`.
4. **Never start or re-run a deploy or CI run without a go for that run.** A go to merge isn't a go
   to start a run. To find out whether something is reachable or allowed, use read-only calls.
   Doc: `conventions.md`.
5. **Secrets and people's data never go in git:** not in code, commits, PRs, issues, logs, test data
   or screenshots. Committed config holds placeholders. If one slips in, tell the person at once.
   Doc: `conventions.md`.
6. **A mistake that happens twice becomes a check that fails.** Mechanical facts (a path exists,
   copies match, a page is published) get a test or CI check, not a reminder. Judgment calls stay
   with people. Doc: `checks-over-reminders.md`.
<!-- END governance:core-rules -->

## Project rules

### About this project

- What it owns: bensonlabs.org itself. The blog posts, About, the site header and layouts, and the
  build and deploy of the whole site (GitHub Pages, from `master`). Everything under `/projects/`
  comes from bensonlabs/projects and bensonlabs/games, and `/bootstraps/` from bensonlabs/bootstraps,
  as pinned releases ("components"); this repo assembles them and never edits them
  (CONTRIBUTING.md, "Headers, project pages, and components").
- Lifecycle stage (experiment, project, maintained, product, archived): maintained. A personal
  site with one user, Justin; the hub that deploys the whole site since 2026-11-07 (ADRs 1 to 5).

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

### Checks this project relies on

Each stops a mistake that happened once or would break the site (core rule 6):

- The tests in `.github/scripts/` (every pull request, and before every deploy): the release
  manifest and unpacking limits in `components.py`, the page check's own cases, and
  `test_docs.py`: every repo path the docs cite in backticks exists.
- `.github/scripts/check-nav.sh` after a build (same times): the home page and the menu's pages
  exist, the four App Store pages exist (`APP_STORE_PAGES`), every redirect lands on a page,
  normal pages have the site header and games don't.
- actionlint (pull request job "Lint the workflows"): the workflow files are valid, and their
  scripts pass shellcheck.
- Update components compares the live `deployed-commit.txt` with master and redeploys a site
  that's behind (ADR 4).

### Where things live

- Pages and navigation: posts in `_posts/`, About in `about.md`, the home page in `index.html`;
  the header in `_includes/nav.html` with its links in `_data/navigation.yml`; layouts in
  `_layouts/`. `/projects/` comes from the components.
- Help or user docs: `README.md`, `CONTRIBUTING.md`.
- Starter docs: none yet.
- API endpoints: none; a static site.
