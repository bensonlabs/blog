#!/usr/bin/env node
// Reminds the agent to check what already exists before it adds new surface (core rule 1 in
// CLAUDE.md): a new file such as a page or route, or a new line such as a permission, a role or a
// menu entry, as reminders.config.json defines them. Runs before Write, Edit and MultiEdit. It never
// blocks: it always exits 0, and any error is swallowed so a hook bug can't get in the way of a write.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CONFIG_PATH, addedBetween, addedLineHits, fileNamed, loadConfig, matchesAny, nameInNotes, readNotes } from './reminders-lib.mjs';

// The lines this tool call adds, without reading anything it doesn't change.
function addedLines(tool, input, abs) {
  if (tool === 'Write') return addedBetween(existsSync(abs) ? readFileSync(abs, 'utf8') : '', input.content);
  if (tool === 'Edit') return addedBetween(input.old_string, input.new_string);
  if (tool === 'MultiEdit') return (input.edits ?? []).flatMap((e) => addedBetween(e.old_string, e.new_string));
  return [];
}

function main() {
  const event = JSON.parse(readFileSync(0, 'utf8'));
  const root = process.env.CLAUDE_PROJECT_DIR || event.cwd || process.cwd();
  const tool = event.tool_name ?? 'Write';
  const input = event.tool_input ?? {};
  if (!input.file_path) return;

  const config = loadConfig(root);
  if (!config) return;
  const abs = path.resolve(root, input.file_path);
  const rel = path.relative(root, abs).split(path.sep).join('/');
  if (rel.startsWith('..')) return;

  const found = [];
  const isNewFile = tool === 'Write' && !existsSync(abs);
  if (isNewFile && matchesAny(config.newFiles, rel)) found.push({ label: rel, name: null });
  const hits = config.addedLines.length ? addedLineHits(config, rel, addedLines(tool, input, abs)) : [];
  for (const hit of hits) found.push({ label: `${hit.what} "${hit.name}" in ${rel}`, name: hit.name });
  if (!found.length) return;

  const notes = readNotes(root, config.notesDir);
  const open = found.filter((f) => (f.name ? !nameInNotes(notes, f.name) : !fileNamed(notes, rel)));
  if (!open.length) return;

  const what = open.map((f) => f.label).join('; ');
  process.stdout.write(JSON.stringify({
    systemMessage: `Heads up: ${what} looks like new surface. Check what already exists before building it (feature-fit). Nothing was blocked.`,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext:
        `${what} matches ${CONFIG_PATH}, so it looks like new user-facing surface (core rule 1). Before building further,`
        + ' run the feature-fit skill: write down the need, search what already exists, show the person a fit matrix'
        + ' and a verdict (use as-is / extend / new), and ask whether to continue. If it is not really new surface,'
        + ` save a two-line note in ${config.notesDir}/ that names it and says why; the reminder then stops.`,
    },
  }));
}

try {
  main();
} catch {
  // A hook bug must never get in the way of a write.
}
process.exit(0);
