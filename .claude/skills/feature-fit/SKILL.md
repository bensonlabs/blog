---
name: feature-fit
description: Before building NEW surface (a new page or route, screen, top-level command, permission or menu entry), check whether people can already do it, or could with a small change to an existing feature. Writes a one-page note with a fit matrix and a verdict (use as-is / extend / new). Not for bug fixes, refactors, or a column, filter or action on an existing page.
---

# Feature fit: can this already be done?

Keep it to one page, not a research project. A person makes the call; your job is to make the
alternatives visible, with evidence. Rule: core rule 1 in CLAUDE.md.

## 1. Write down the need

- Who needs it, and the moment they need it.
- 3 to 6 requirements, each one testable ("pick one or more buildings", "includes substitutes",
  "email everyone in one step").

## 2. Search what exists

Search with the need's keywords and the things it touches. The project rules in CLAUDE.md
("Where things live") say where each of these is in this project:

| What | Look for |
|---|---|
| Pages and navigation | a page, menu entry or route that already covers part of it |
| Help or user docs | what pages do, in users' words |
| Starter docs | business rules, endpoints and pages of the modules involved |
| Reports, exports, saved queries | data people can already pull |
| API endpoints | data or actions that exist without a page |
| The system being replaced, if any | how people do it there today |
| Permissions | who can use each candidate, and who would gain access to what |

If the app is running, open the best two to four candidates: a page often does more than its name
says (filters, toolbar actions, menus).

## 3. Fill the fit matrix

Rows: the candidates. Columns: the requirements. Cells: ✓ / partial / ✗ with a few words of
evidence.

## 4. Weigh each option

- **Use as-is:** the exact steps someone follows today. If that's good enough, the deliverable is a
  help article or a saved report, not code.
- **Extend an existing feature:** what changes (a column, a filter, an action), and whether it bends
  that feature away from its purpose or its audience.
- **New:** the footprint (pages, endpoints, permissions, data), who gains access to what, and any
  logic it duplicates (name the source it mirrors).

## 5. Verdict

Prefer use as-is, then extend, then new. Choose new only when extending would bend an existing
feature away from its purpose or audience, when a narrow new permission is safer than widening a
broad one, or when the extension would cost more than the new feature and be used less.

## 6. Show the person, then record it

1. Show the fit matrix and the verdict before building anything. The person decides.
2. Save `docs/feature-fit/<yyyy-mm-dd>-<slug>.md` from `docs/feature-fit/TEMPLATE.md`. Its
   **Adds** line names the new path, route, permission or menu entry exactly: the reminders look
   for the file's path (or its folder) and for the name of an added permission, role or menu entry.
3. Paste the fit matrix and the verdict into the PR description under "Existing features
   considered". If the verdict is "new", say why in one sentence.

**If a reminder flagged a change** (while writing, or at push), this skill is what it asked for: pause the build, do steps
1 to 6, and let the person decide whether to continue. If it isn't really new surface (a navigation
or shell screen, say), save a two-line note instead (`# <path>` and `Not a new feature: <reason>`),
or put `Feature-Fit: none - <reason>` in the commit message.
