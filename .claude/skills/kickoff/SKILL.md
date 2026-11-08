---
name: kickoff
description: Start new work - a fresh branch, read what applies, check for existing features if it adds new surface, note where the requirements come from, then a short plan before any code.
---

# Kickoff

Use this before starting any non-trivial piece of work.

1. **Branch.** Fetch, then create a fresh branch from the up-to-date target branch, both as the
   project rules say under "Branches, review and release" (default name `feature/<short-name>`).
   If other work is in progress in this checkout, use a new git worktree under `.claude/worktrees/`
   instead of switching branches.
2. **Read first.**
   - The newest handoff note for this work, if there is one (`~/.claude/handoffs/`).
   - The project rules in CLAUDE.md that cover this area.
   - The starter doc for each module you'll touch (see `docs/STARTER_DOC_TEMPLATE.md` for the shape).
   - Decision records in `docs/decisions/` that touch it, so a settled call isn't re-argued.
   - If the work touches who can see or do what, core rule 9.
3. **New surface?** If the work adds a page, route, screen, command, permission or menu entry, run
   the `feature-fit` skill before building (core rule 1).
4. **Sources.** Write down where each requirement comes from (a spec, a ticket, the system being
   replaced, a person's decision). You'll cite them in the code (core rules 4 and 5).
5. **Plan.** For anything beyond a trivial change: what changes, which files, the main risk, and
   which docs change with it (core rule 2). Show the plan and wait for a yes before writing code.
