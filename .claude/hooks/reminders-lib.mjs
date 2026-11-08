// Shared by the reminder hooks (new-surface-reminder.mjs while the agent writes, push-reminder.mjs at
// push). Reads reminders.config.json and answers "is this new surface?" and "does a note name it?".
// Reminders are nudges, so text patterns are enough here; an audit that decides something about code
// structure uses a parser (core rule 8).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export const CONFIG_PATH = '.claude/hooks/reminders.config.json';

export function loadConfig(root) {
  const file = path.join(root, CONFIG_PATH);
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const ns = raw.newSurface ?? {};
  const di = raw.docsImpact ?? {};
  return {
    newFiles: (ns.newFiles ?? []).map(globToRegExp),
    addedLines: (ns.addedLines ?? []).map((rule) => ({
      files: globToRegExp(rule.files),
      pattern: new RegExp(rule.pattern),
      what: rule.what || 'entry',
    })),
    notesDir: ns.notesDir ?? 'docs/feature-fit',
    code: (di.code ?? []).map(globToRegExp),
    docs: (di.docs ?? []).map(globToRegExp),
  };
}

// Globs relative to the project root: ** matches any folders, * any name, ? one character.
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      i++;
      if (glob[i + 1] === '/') {
        i++;
        re += '(?:.*/)?';
      } else {
        re += '.*';
      }
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`, 'i');
}

export const matchesAny = (patterns, rel) => patterns.some((p) => p.test(rel));

// The text of every feature-fit note, lower-cased, for "does a note name this?".
export function readNotes(root, notesDir) {
  const dir = path.join(root, notesDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'TEMPLATE.md')
    .map((name) => readFileSync(path.join(dir, name), 'utf8').toLowerCase());
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A new file is covered when a note names its path, or its folder as a whole path.
export function fileNamed(notes, rel) {
  const folder = path.posix.dirname(rel);
  const patterns = [new RegExp(`${escape(rel.toLowerCase())}(?![\\w.\\-/])`)];
  if (folder !== '.') patterns.push(new RegExp(`${escape(folder.toLowerCase())}(?![\\w.\\-/])`));
  return notes.some((text) => patterns.some((p) => p.test(text)));
}

// Added lines in a file that look like new surface (a permission, a role, a menu entry), each with
// the name a note has to mention: the pattern's first capture group, or the whole line.
export function addedLineHits(config, rel, addedLines) {
  const hits = [];
  for (const rule of config.addedLines) {
    if (!rule.files.test(rel)) continue;
    for (const line of addedLines) {
      const m = line.match(rule.pattern);
      if (m) hits.push({ what: rule.what, name: (m[1] ?? line).trim(), rel });
    }
  }
  return hits;
}

export const nameInNotes = (notes, name) => notes.some((text) => text.includes(name.toLowerCase()));

// Lines in `after` that aren't in `before`.
export function addedBetween(before, after) {
  const had = new Set((before ?? '').split(/\r?\n/));
  return (after ?? '').split(/\r?\n/).filter((line) => line.trim() && !had.has(line));
}
