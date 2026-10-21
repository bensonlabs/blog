// Long-run test: does frame time degrade? Are entity arrays bounded?
//
// The sampler deliberately avoids `awaitPromise` on a rAF-driven promise: if
// rAF is ever starved (throttled tab, occluded window, compositor stall) that
// promise never resolves and the whole run hangs with no output. Instead the
// page stashes its result on window and this script polls for it, and the
// in-page sampler has its own wall-clock deadline.
import { launch, CDP, newPage, PAGE_URL, outPath } from './cdp.mjs';
import { appendFileSync, writeFileSync } from 'node:fs';

const OUT = outPath('lumen-leak.txt');
writeFileSync(OUT, '');
// Accepts any number of columns; they are joined so a row stays on one line.
const log = (...cols) => {
  const s = cols.join(' ');
  appendFileSync(OUT, s + '\n');
  console.log(s);
};

const W = 1280, H = 800;
const { proc, wsUrl, close } = await launch({ width: W, height: H });
const cdp = await CDP.connect(wsUrl);
const page = await newPage(cdp);
const S = page.send;
await S('Runtime.enable');
await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2500));

await S('Runtime.evaluate', { expression: `LUMEN.startGame(); LUMEN.S.autoQuality = false;` });

// Keep the player alive AND shooting so the sim stays busy. Without a bot
// that holds fire, the game sits idle at wave 1 with no bullets and the test
// proves nothing about entity growth under load.
await S('Runtime.evaluate', { expression: `
  window.__bot = setInterval(() => {
    const S = LUMEN.S, p = LUMEN.player;
    if (!p) return;
    if (S.mode !== 'play') { LUMEN.startGame(); S.autoQuality = false; return; }
    let best = null, bd = 1e9;
    for (const e of LUMEN.enemies) {
      if (e.dead) continue;
      const d = (e.x-p.x)**2 + (e.y-p.y)**2;
      if (d < bd) { bd = d; best = e; }
    }
    if (best) {
      const z = S.zoom;
      LUMEN.Input.mouse.x = (best.x - S.cam.x)*z + innerWidth/2;
      LUMEN.Input.mouse.y = innerHeight/2 - (best.y - S.cam.y)*z;
      LUMEN.Input.mouse.down = true;
    }
    if (p.hp < 35) p.hp = 100;
  }, 50);
`});

// Kick off a sample. The page resolves window.__sample when it has 60 frames
// OR when 3s of wall clock has passed, whichever comes first.
async function startSample(tag) {
  await S('Runtime.evaluate', { expression: `
    window.__sample = null; window.__sampleTag = ${JSON.stringify(tag)};
    (function(){
      const ts=[]; let last=performance.now(), n=0;
      const t0=performance.now();
      function tick(){
        const now=performance.now(); ts.push(now-last); last=now; n++;
        if(n<60 && now-t0<3000){ requestAnimationFrame(tick); return; }
        ts.sort((a,b)=>a-b);
        const med = ts.length ? ts[Math.floor(ts.length/2)] : 0;
        window.__sample = JSON.stringify({
          med:+med.toFixed(2),
          fps:+(1000/Math.max(med,0.001)).toFixed(1),
          frames:n,
          mode:LUMEN.S.mode, wave:LUMEN.S.wave, score:LUMEN.S.score,
          en:LUMEN.enemies.length, bl:LUMEN.bullets.length, eb:LUMEN.ebullets.length,
          pk:LUMEN.pickups.length,
          domPops:document.querySelectorAll('#pops .pop').length,
          nodes:document.getElementsByTagName('*').length,
          heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : -1
        });
      }
      requestAnimationFrame(tick);
    })();
  ` });
}

// Poll for the sample. Bounded: if it never arrives we report that instead of
// hanging the whole run.
async function sample(tag) {
  await startSample(tag);
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 150));
    const res = await S('Runtime.evaluate', {
      expression: 'window.__sample', returnByValue: true
    });
    const v = res.result.value;
    if (v) return JSON.parse(v);
  }
  throw new Error(`sample ${tag} never resolved (rAF starved?)`);
}

log('t(s)  med(ms)  fps   frames  wave  score   ent  bul  ebul  pick  pops  nodes  heap(MB)');
try {
  const SAMPLES = 24;
  for (let i = 0; i < SAMPLES; i++) {
    await new Promise(r => setTimeout(r, 2500));
    const s = await sample(i + 1);
    log(
      String((i + 1) * 2.5).padStart(4),
      String(s.med).padStart(7),
      String(s.fps).padStart(6),
      String(s.frames).padStart(7),
      String(s.wave).padStart(5),
      String(s.score).padStart(6),
      String(s.en).padStart(5),
      String(s.bl).padStart(5),
      String(s.eb).padStart(5),
      String(s.pk).padStart(5),
      String(s.domPops).padStart(5),
      String(s.nodes).padStart(6),
      String(s.heap).padStart(8)
    );
  }
  log('\nOK: ' + SAMPLES + ' samples collected');
} catch (e) {
  log('\nFAILED: ' + e.message);
}

try { await S('Runtime.evaluate', { expression: 'clearInterval(window.__bot)' }); } catch (e) {}
cdp.close();
close();
process.exit(0);
