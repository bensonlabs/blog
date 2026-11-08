#!/usr/bin/env node
// Push reminder (core rules 1 to 3): the backstop for work done without the agent, or a step the
// agent forgot. Looks at the commits being pushed and prints a reminder when they add new surface no
// feature-fit note names, or change code with no doc change, and no commit message answers it with a
// "Feature-Fit: none - <reason>" or "Docs-Impact: none - <reason>" line. It never blocks a push: it
// always exits 0. What counts is set in reminders.config.json, next to this file.
//
//   node .claude/hooks/push-reminder.mjs --install          make it this clone's git pre-push hook
//   node .claude/hooks/push-reminder.mjs                    check what the current branch would push
//   node .claude/hooks/push-reminder.mjs --base <ref> [--head <ref>]   check a range (in CI, say)
// As a pre-push hook, git passes the pushed refs on stdin; there it is silent unless it has a
// reminder. Run by hand or in CI, it also says when there is nothing to remind about. In GitHub
// Actions each reminder is also printed as a warning annotation (.github/workflows/reminders.yml).
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { addedLineHits, fileNamed, loadConfig, matchesAny, nameInNotes, readNotes } from './reminders-lib.mjs';

const MARK = 'architectureOS push reminder';
const ZERO = /^0+$/;

const git = (root, args) => execFileSync('git', args, {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});
function tryGit(root, args) {
  try {
    return git(root, args);
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const args = { install: false, base: null, head: 'HEAD', hook: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--install') args.install = true;
    else if (argv[i] === '--base') args.base = argv[++i];
    else if (argv[i] === '--head') args.head = argv[++i];
    // git passes the remote's name and URL as arguments: their presence means it runs as a hook.
    else if (!argv[i].startsWith('--')) args.hook = true;
  }
  return args;
}

function install(root) {
  const hooksDir = path.resolve(root, git(root, ['rev-parse', '--git-path', 'hooks']).trim());
  const file = path.join(hooksDir, 'pre-push');
  const line = 'node "$(git rev-parse --show-toplevel)/.claude/hooks/push-reminder.mjs" "$@"';
  if (existsSync(file)) {
    if (readFileSync(file, 'utf8').includes(MARK)) return `already installed (${file}).`;
    return `not installed: ${file} already exists. To add the reminder, put this line in it before its last command: ${line} || true`;
  }
  mkdirSync(hooksDir, { recursive: true });
  writeFileSync(file, `#!/bin/sh\n# ${MARK}: it prints reminders and never blocks the push.\n`
    + `# Installed by: node .claude/hooks/push-reminder.mjs --install\n${line} || true\nexit 0\n`);
  try {
    chmodSync(file, 0o755);
  } catch {
    // Windows doesn't need the execute bit.
  }
  return `installed (${file}).`;
}

const revList = (root, range) => (tryGit(root, ['rev-list', '--reverse', ...range]) ?? '').split('\n').filter(Boolean);

function pushedCommits(root, args) {
  if (args.base) return revList(root, [`${args.base}..${args.head}`]);
  let input = '';
  if (!process.stdin.isTTY) {
    try {
      input = readFileSync(0, 'utf8');
    } catch {
      input = '';
    }
  }
  const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length) {
    const commits = new Set();
    for (const line of lines) {
      const [, localSha, , remoteSha] = line.split(/\s+/);
      if (!localSha || ZERO.test(localSha)) continue; // a branch being deleted
      const range = remoteSha && !ZERO.test(remoteSha) ? [`${remoteSha}..${localSha}`] : [localSha, '--not', '--remotes'];
      for (const sha of revList(root, range)) commits.add(sha);
    }
    return [...commits];
  }
  const upstream = tryGit(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  return revList(root, upstream ? [`${upstream.trim()}..HEAD`] : ['HEAD', '--not', '--remotes']);
}

function commitInfo(root, sha) {
  const message = git(root, ['log', '-1', '--format=%B', sha]);
  const fields = git(root, ['diff-tree', '-r', '--no-commit-id', '--name-status', '--root', '-z', sha]).split('\0').filter(Boolean);
  const changes = [];
  for (let i = 0; i + 1 < fields.length; i += 2) changes.push({ status: fields[i][0], path: fields[i + 1] });
  return { sha, message, changes };
}

function addedInCommit(root, sha, file) {
  const diff = git(root, ['show', '--format=', '-U0', '--no-color', sha, '--', file]);
  return diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).filter((l) => l.trim());
}

const sample = (items) => (items.length > 3 ? `${items.slice(0, 3).join(', ')} and ${items.length - 3} more` : items.join(', '));

function check(root, args) {
  const config = loadConfig(root);
  if (!config) return { reminders: [], checked: 0, configured: false };
  const commits = pushedCommits(root, args).map((sha) => commitInfo(root, sha));
  if (!commits.length) return { reminders: [], checked: 0, configured: true };
  const answered = (key) => commits.some((c) => new RegExp(`^${key}:\\s*\\S`, 'mi').test(c.message));
  const reminders = [];

  const notes = readNotes(root, config.notesDir);
  const surface = new Set();
  for (const commit of commits) {
    for (const change of commit.changes) {
      if (change.status === 'A' && matchesAny(config.newFiles, change.path) && !fileNamed(notes, change.path)) {
        surface.add(change.path);
      }
      if (change.status !== 'D' && config.addedLines.some((rule) => rule.files.test(change.path))) {
        for (const hit of addedLineHits(config, change.path, addedInCommit(root, commit.sha, change.path))) {
          if (!nameInNotes(notes, hit.name)) surface.add(`${hit.what} "${hit.name}" in ${hit.rel}`);
        }
      }
    }
  }
  if (surface.size && !answered('Feature-Fit')) {
    reminders.push(`New surface with no feature-fit note: ${sample([...surface])}. Run the feature-fit skill, or answer it`
      + ' in a commit message: "Feature-Fit: none - <reason>".');
  }

  const changed = [...new Set(commits.flatMap((c) => c.changes.map((ch) => ch.path)))];
  const code = changed.filter((p) => matchesAny(config.code, p));
  const docs = changed.filter((p) => matchesAny(config.docs, p));
  if (code.length && !docs.length && !answered('Docs-Impact')) {
    reminders.push(`Code changed but no doc did (${sample(code)}). Update the doc that describes it in the same commit,`
      + ' or answer it in a commit message: "Docs-Impact: none - <reason>".');
  }
  return { reminders, checked: commits.length, configured: true };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = git(process.cwd(), ['rev-parse', '--show-toplevel']).trim();
  if (args.install) {
    console.log(install(root));
    return;
  }
  const { reminders, checked, configured } = check(root, args);
  if (!reminders.length) {
    if (args.hook) return; // a clean push stays quiet
    if (!configured) console.log(`${MARK}: no .claude/hooks/reminders.config.json, so nothing was checked.`);
    else if (!checked) console.log(`${MARK}: no commits to check.`);
    else console.log(`${MARK}: nothing to remind about (checked ${checked} commit${checked === 1 ? '' : 's'}).`);
    return;
  }
  if (process.env.GITHUB_ACTIONS === 'true') {
    const escape = (text) => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    for (const reminder of reminders) console.log(`::warning title=Push reminder::${escape(reminder)}`);
  }
  process.stderr.write(`\n${MARK} (it never blocks the push):\n${reminders.map((r) => `- ${r}`).join('\n')}\n\n`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`${MARK}: skipped (${String(err.message).split('\n')[0]}).\n`);
}
process.exit(0);
