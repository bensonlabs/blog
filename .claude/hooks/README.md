# Hooks

These hooks remind; they never block (architectureOS `docs/hooks-nudge-not-block.md`). What they
look for is set in `reminders.config.json`; while its lists are empty, they stay quiet.

## new-surface-reminder.mjs (while the agent writes)

Runs before every Write, Edit and MultiEdit (wired in `../settings.json`). It fires when the change
adds new surface that no note in `docs/feature-fit/` names:

- a **new file** matching `newSurface.newFiles` (a page, a route), or
- an **added line** matching one of `newSurface.addedLines` in an existing file (a permission, a
  role, a menu entry). The pattern's first group is the name a note has to mention.

Then it shows the person one line (`systemMessage`) and tells the agent, next to the tool's result
(`additionalContext`), to pause and run the `feature-fit` skill. The write itself always goes
through.

## push-reminder.mjs (at push)

The backstop for work done without the agent. As the clone's git `pre-push` hook it looks at the
commits being pushed and prints a reminder when:

- they add new surface (as above) that no feature-fit note names, and no commit message has a
  `Feature-Fit: none - <reason>` line; or
- they change code matching `docsImpact.code` but no doc matching `docsImpact.docs`, and no commit
  message has a `Docs-Impact: none - <reason>` line.

A line in any of the pushed commits answers for the whole push. It always exits 0.

- **Install it** once per clone (git hooks aren't committed; setup installs it in the clone it
  ran in): `node .claude/hooks/push-reminder.mjs --install`. It won't overwrite an existing
  `pre-push` hook; it prints the line to add instead.
- **Run it by hand** to see what the current branch would push: `node .claude/hooks/push-reminder.mjs`.
  It says so when there's nothing to remind about; as a git hook it stays quiet then.
- **In CI**: `.github/workflows/reminders.yml` runs it on every pull request and shows each reminder
  as a warning on the PR (never a failure). It covers clones without the hook and GitHub's web
  editor. Don't want it? Delete the file; sync leaves it out. By hand: `--base origin/main`.

## Setting them up

Example `reminders.config.json` for a Next.js app:

```json
{
  "newSurface": {
    "newFiles": ["src/app/**/page.tsx"],
    "addedLines": [{ "files": "src/lib/permissions.ts", "pattern": "^ *([A-Za-z0-9_]+): '", "what": "permission" }],
    "notesDir": "docs/feature-fit"
  },
  "docsImpact": { "code": ["src/**"], "docs": ["docs/**", "help/**"] }
}
```

The patterns are text matches: fine for a reminder, which only nudges. An audit that decides
something about code structure uses a parser (core rule 8).

## How a Claude Code hook speaks

Print JSON to stdout and exit 0. `systemMessage` reaches the person;
`hookSpecificOutput.additionalContext` reaches the agent. Text on stderr with exit 0 is seen by no
one, and exit 2 blocks the tool call, which a reminder must never do. (A git hook is different: git
shows its stderr to the person pushing.)

**Requires** Node.js on the PATH. `reminders-lib.mjs` is shared by both hooks.
