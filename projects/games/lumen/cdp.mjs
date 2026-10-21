// Dependency-free Chrome DevTools Protocol driver (Node 22 built-in WebSocket).
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

// Where this project lives, derived from the module's own location rather
// than hardcoded — the harness has to run from any checkout.
export const HERE = dirname(fileURLToPath(import.meta.url));
export const INDEX_PATH = join(HERE, 'index.html');
export const PAGE_URL = 'file://' + INDEX_PATH;
// A path inside the project directory, for the temporary instrumented copies
// some checks write.
export const TMP_PAGE = join(HERE, '.rv.html');
// Scratch space for test output. Uses the platform temp directory so the
// harness does not litter the checkout.
export const OUT_DIR = tmpdir();
export const outPath = (name) => join(OUT_DIR, name);

// Locate a Chromium build. LUMEN_CHROME overrides the search entirely;
// otherwise the Playwright cache is probed, and finally any Chrome already
// installed on the system.
const CHROME_CANDIDATES = [
  process.env.LUMEN_CHROME,
  process.env.HOME + '/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const SHELL = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';

// Prefer the full Chromium in --headless=new mode. The headless *shell* uses
// a different swapchain that throttles hard under continuous GL work — it
// reports ~3fps for a scene that actually runs at 60fps, so it is only a
// fallback for when the full build is unavailable.
const BIN = CHROME_CANDIDATES.find(p => existsSync(p)) || (existsSync(SHELL) ? SHELL : null);
const FULL = BIN ? !BIN.includes('headless-shell') : false;

// Pick a port that is actually free. A stale browser left listening on an
// old port would otherwise be reused, and the test would silently measure
// the wrong browser.
import { createServer } from 'node:net';
function freePort() {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.on('error', rej);
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port;
      srv.close(() => res(p));
    });
  });
}
export async function launch({ width = 1440, height = 900, gpu = true } = {}) {
  if (!BIN) {
    throw new Error(
      'No Chromium build found. Install one (the Playwright cache or a system ' +
      'Chrome), or point LUMEN_CHROME at the binary.'
    );
  }
  // Each launch gets its own port, so two scripts (or a stale browser left
  // on an old port) can never be mistaken for each other.
  const port = await freePort();
  const profile = join(tmpdir(), 'lumen-cdp-profile-' + port);
  const args = [
    `--remote-debugging-port=${port}`,
    '--window-size=' + width + ',' + height,
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--user-data-dir=' + profile,
    'about:blank'
  ];
  if (FULL) args.push('--headless=new');
  if (gpu) args.push('--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=metal');

  const proc = spawn(BIN, args, { stdio: 'ignore', detached: false });

  // wait for the debugger endpoint
  let info = null;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) { info = await r.json(); break; }
    } catch (e) { /* not up yet */ }
    await new Promise(r => setTimeout(r, 100));
  }
  if (!info) { proc.kill(); throw new Error('chrome did not start'); }
  return { proc, port, wsUrl: info.webSocketDebuggerUrl, profile, close: () => shutdown(proc, profile) };
}

// Shut the browser down and remove the profile directory it created.
// Chrome writes a lot into its profile while it runs, and leaving 100+ of
// those behind in the shared temp directory is both wasteful and noisy.
//
// The removal is SYNCHRONOUS on purpose: the calling scripts do
// `close(); process.exit(0);`, which would kill a pending timer before it
// could fire and leave the directory behind again.
export function shutdown(proc, profile) {
  try { proc.kill('SIGTERM'); } catch (e) { /* already gone */ }
  if (!profile) return;
  // Block briefly so Chrome can release its files. Atomics.wait on a
  // SharedArrayBuffer is the only synchronous sleep available in Node.
  const sab = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(sab), 0, 0, 400);
  // maxRetries covers the case where a file is still being written.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return;
    } catch (e) {
      Atomics.wait(new Int32Array(sab), 0, 0, 200);
    }
  }
}

export class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = e => rej(new Error('ws error')); });
    const c = new CDP(ws);
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id);
        c.pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message + ' ' + (msg.error.data || ''))) : res(msg.result);
      } else if (msg.method) {
        c.listeners.forEach(l => l(msg));
      }
    };
    return c;
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  on(fn) { this.listeners.push(fn); }
  close() { try { this.ws.close(); } catch (e) {} }
}

export async function newPage(cdp) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => cdp.send(m, p, sessionId);
  return { sessionId, send: S };
}
