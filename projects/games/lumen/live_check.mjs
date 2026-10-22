// Live-deployment check for LUMEN.
//
// The other scripts in this folder all drive the local file:// copy. This one
// drives the DEPLOYED page at https://bensonlabs.org/projects/games/lumen/,
// so it proves the thing a visitor actually gets: that the published build
// boots, renders, and plays.
//
// It reads the game's own state object (S.mode, S.score, ...) rather than
// scraping the HUD text. That matters: `.screen` hides overlays with
// opacity:0 rather than display:none, so document.body.innerText still
// contains the text of hidden overlays — a text scrape of the paused state
// reads "PAUSED" even while the game is running.
//
// Usage: node live_check.mjs
// Set LUMEN_LIVE_URL to check a different deployment.
import { launch, CDP, newPage } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.LUMEN_LIVE_URL || 'https://bensonlabs.org/projects/games/lumen/';
const SHOT = join(tmpdir(), 'lumen-live.png');

const { wsUrl, close } = await launch({ width: 1280, height: 800 });
const cdp = await CDP.connect(wsUrl);
const { send } = await newPage(cdp);

const consoleErrors = [];
const pageErrors = [];
cdp.on(msg => {
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args.map(a => a.value ?? a.description ?? a.type).join(' '));
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    pageErrors.push(msg.params.exceptionDetails?.exception?.description
      || msg.params.exceptionDetails?.text || 'unknown');
  }
});

await send('Runtime.enable');
await send('Page.enable');

const loaded = new Promise(res => cdp.on(m => { if (m.method === 'Page.loadEventFired') res(); }));
await send('Page.navigate', { url: URL });
await loaded;
await new Promise(r => setTimeout(r, 1500));

const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

const snap = () => ev(`({
  mode: S.mode, score: S.score, kills: S.kills, wave: S.wave,
  enemies: enemies.length, quality: S.quality, partCount: S.partCount,
  onScreen: (document.querySelector('.screen.on')||{}).id || null,
  fps: (document.getElementById('tFps')||{}).textContent || null,
  draws: (document.getElementById('tDrw')||{}).textContent || null
})`);

const before = await snap();

// The game starts on ENTER (see the keydown handler in index.html).
await ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}))`);
await new Promise(r => setTimeout(r, 400));
const afterEnter = await snap();

// Autoplay: aim at the nearest enemy and hold fire, so the real bullet and
// collision path runs rather than the key being flapped.
await ev(`window.__autoplay = setInterval(() => {
  if (S.mode !== 'play' || !player) return;
  let best = null, bd = 1e9;
  for (const e of enemies) { const d = Math.hypot(e.x-player.x, e.y-player.y); if (d < bd) { bd = d; best = e; } }
  if (!best) return;
  const ang = Math.atan2(best.y-player.y, best.x-player.x);
  Input.mouse.x = ARENA.cx + Math.cos(ang)*400;
  Input.mouse.y = ARENA.cy + Math.sin(ang)*400;
  Input.mouse.down = true;
}, 50);`);

const samples = [];
for (let i = 0; i < 12; i++) {
  await new Promise(r => setTimeout(r, 1000));
  samples.push(await snap());
}
await ev(`clearInterval(window.__autoplay); Input.mouse.down = false;`);

const final = await snap();
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(SHOT, Buffer.from(shot.data, 'base64'));

const fpsVals = samples.map(s => Number(s.fps)).filter(n => !Number.isNaN(n));
const scores = samples.map(s => s.score);

const report = {
  url: URL,
  modeAtLoad: before.mode,
  modeAfterEnter: afterEnter.mode,
  finalMode: final.mode,
  onScreen: final.onScreen,
  scoreProgression: scores,
  scoreGained: final.score - before.score,
  kills: final.kills,
  wave: final.wave,
  fpsMin: fpsVals.length ? Math.min(...fpsVals) : null,
  draws: final.draws,
  particles: final.partCount,
  quality: final.quality,
  screenshot: SHOT,
  consoleErrors,
  pageErrors,
};
console.log(JSON.stringify(report, null, 2));

cdp.close();
close();

// Fail loudly if the deployment is broken, so this can gate a release.
const problems = [];
if (afterEnter.mode !== 'play') problems.push(`game did not start (mode=${afterEnter.mode})`);
if (final.score === 0) problems.push('score never advanced — the game is not playing');
if (consoleErrors.length) problems.push(`${consoleErrors.length} console error(s)`);
if (pageErrors.length) problems.push(`${pageErrors.length} page exception(s)`);
if (problems.length) {
  console.error('LIVE CHECK FAILED: ' + problems.join('; '));
  process.exit(1);
}
console.log('LIVE CHECK PASSED');
process.exit(0);
