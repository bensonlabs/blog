---
name: wrap-up
description: Finish the current branch - bring it up to date, run the checks and the push reminder, try it in the running app, make sure docs moved with the code, write the PR description, and push only when the person says so.
---

# Wrap-up

Use this when a branch is ready to become a PR.

1. **Bring the branch up to date.** Fetch, then merge the target branch in (or rebase, if the
   project rules say so) and resolve any conflicts. Never trust a stale remote ref.
2. **Checks.** Run the commands under "Commands" in CLAUDE.md's project rules (tests, type check,
   lint). Fix failures; never skip hooks. Then run `node .claude/hooks/push-reminder.mjs` and deal
   with what it prints (steps 4 and 6 say how).
3. **Try it.** Run the app and use the change the way a person would (for a web page, in a browser
   at phone and desktop widths). Passing tests aren't the same as working. Note what you tried for
   "How it was tested".
4. **Docs moved with the code** (core rule 2). Each behavior change has its doc updated in the same
   commit, or the commit carries `Docs-Impact: none - <why>`.
5. **Sources, inventions and access** (core rules 4, 5 and 9). Every new validation, permission
   check or business rule cites its source or is marked `// invented:`. Collect the invented ones,
   and any change that widens who can see or do what.
6. **New surface** (core rule 1). A feature-fit note exists, or a commit carries
   `Feature-Fit: none - <why>`.
7. **User data** (core rule 11). If the change deletes or rewrites data people created, the export
   and restore check is done and described.
8. **Decision records** (core rule 7) for any decision made or reversed in this work.
9. **PR description**, in this order:
   1. **What anyone has to do**, if anything beyond reviewing: scripts to run (with where, in what
      order, dry run first), settings to change, behavior to approve. One numbered list.
   2. **What changed and why.**
   3. **Existing features considered** - the fit matrix and verdict, when feature-fit ran.
   4. **Invented rules and wider access to approve**, if any.
   5. **How it was tested**, keeping the work states apart (core rule 10): what ran and passed,
      what was tried by hand, what wasn't checked.
10. **Push and open the PR only when the person says so.** Request review from the reviewer the
    project rules name and confirm the request landed (`gh pr view <n> --json reviewRequests`).
    With no second reviewer, the person reviews the whole diff before merging. Watch CI and report
    its conclusion: read it (`gh run view <id> --json conclusion`); a watch command exiting 0 isn't
    a pass.
11. **Report** where things stand, one state at a time (implemented, verified, accepted, merged,
    released), what needs the person, and any follow-up work this change revealed.
