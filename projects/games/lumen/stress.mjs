// Stress test: force heavy load, confirm the frame rate holds and
// the adaptive quality system behaves sensibly.
import { launch, CDP, newPage, PAGE_URL, outPath } from './cdp.mjs';
import { appendFileSync, writeFileSync } from 'node:fs';

const OUT = outPath('lumen-stress.txt');
writeFileSync(OUT, '');
const log = (...a) => appendFileSync(OUT, a.join(' ') + '\n');

const W = 1440, H = 900;
const { proc, wsUrl, close } = await launch({ width: W, height: H });
const cdp = await CDP.connect(wsUrl);
const page = await newPage(cdp);
const S = page.send;
await S('Runtime.enable');
await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2500));

await S('Runtime.evaluate', { expression: `LUMEN.startGame();` });

// The load has to survive the player dying. With 200 enemies the player dies
// within seconds, and `over` mode freezes the simulation — which silently
// turns every later phase into a no-op (0 bullets, 0 ebullets) while still
// reporting 60fps. So the injected enemies and the held fire button are
// re-applied on every restart.
await S('Runtime.evaluate', { expression: `
  window.__wantHeavy = false;
  window.__wantFire = false;
  window.__pushes = 0;
  window.__maxBl = 0;
  window.__maxEb = 0;
  window.__spawnHeavy = function(){
    for (let i=0;i<200;i++) {
      // Spread them wide and give them a slow approach: 200 grunts spawned
      // close in all converge onto the player within a second, and every
      // player shot is then absorbed inside the wall on the frame it is
      // born — which makes the projectile path look empty when it is not.
      const a=Math.random()*6.283, d=600+Math.random()*900;
      LUMEN.enemies.push({x:LUMEN.player.x+Math.cos(a)*d, y:LUMEN.player.y+Math.sin(a)*d,
        vx:0, vy:0, r:20, hp:50, maxhp:50, spd:45, type:'grunt', col:[1,.3,.4],
        hit:0, fireCd:2, rot:0, seed:Math.random()*10, shoot:1.4, wob:0});
    }
  };
  // Count bullet creations and record the PEAK live-bullet count at the
  // moment of creation. Sampling the array from a timer is a race: a shot
  // fired into a dense wall is consumed on the very next frame, so a
  // periodic snapshot legitimately reads 0.
  {
    const arr = LUMEN.bullets;
    const origPush = arr.push.bind(arr);
    arr.push = function(...a){
      const r = origPush(...a);
      window.__pushes += a.length;
      if (arr.length > window.__maxBl) window.__maxBl = arr.length;
      return r;
    };
  }
  {
    const arr = LUMEN.ebullets;
    const origPush = arr.push.bind(arr);
    arr.push = function(...a){
      const r = origPush(...a);
      if (arr.length > window.__maxEb) window.__maxEb = arr.length;
      return r;
    };
  }
  window.__alive = setInterval(() => {
    if (LUMEN.S.mode === 'over') { LUMEN.startGame(); }
    if (!LUMEN.player) return;
    LUMEN.player.hp = 100;
    if (window.__wantFire) {
      // Firing needs BOTH a held mouse button and a ready cooldown: the game
      // gates on 'Input.mouse.down && p.fireCd <= 0'. Zeroing only the
      // cooldown never produces a shot.
      LUMEN.Input.mouse.down = true;
      LUMEN.player.fireCd = 0;
    }
    if (window.__wantHeavy && LUMEN.enemies.length < 150) window.__spawnHeavy();
  }, 100);
`});

const read = async () => {
  const r = await S('Runtime.evaluate', { expression:
    "JSON.stringify({fps:+document.getElementById('tFps').textContent, q:LUMEN.S.quality, " +
    "mode:LUMEN.S.mode, hp:Math.round(LUMEN.player?LUMEN.player.hp:-1), mdn:LUMEN.Input.mouse.down, " +
    "push:window.__pushes, maxBl:window.__maxBl, maxEb:window.__maxEb, " +
    "en:LUMEN.enemies.length, bl:LUMEN.bullets.length, eb:LUMEN.ebullets.length, " +
    "ents:LUMEN.entities, parts:LUMEN.S.partCount, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576):-1})",
    returnByValue: true });
  return JSON.parse(r.result.value);
};

log('scenario            fps  qual  mode   hp  mdn  push  maxBl  maxEb  enemies  bullets  ebul  drawEnts  parts  heapMB');

async function phase(label, setup, settleMs = 4000) {
  if (setup) await S('Runtime.evaluate', { expression: setup });
  await new Promise(r => setTimeout(r, settleMs));
  const s = await read();
  log(label.padEnd(20), String(s.fps).padStart(4), s.q.padStart(5),
      String(s.mode).padStart(6), String(s.hp).padStart(4), String(s.mdn).padStart(5),
      String(s.push).padStart(5), String(s.maxBl).padStart(6), String(s.maxEb).padStart(6),
      String(s.en).padStart(7), String(s.bl).padStart(7), String(s.eb).padStart(5),
      String(s.ents).padStart(8), String(s.parts).padStart(6), String(s.heap).padStart(7));
  return s;
}

// 1. idle light load
await phase('light (wave 1)');

// 2. heavy: flood the arena with enemies
await phase('heavy (200 enemies)', `
  LUMEN.S.autoQuality = false;
  window.__wantHeavy = true;
`);

// 3. heavy + sustained fire
await phase('heavy + firing', `
  window.__wantFire = true;
`);

// 4. let adaptive quality take over from a heavy state
await phase('auto quality on', `
  LUMEN.S.autoQuality = true;
`, 8000);

// 5. sustained fire with heavy load — the real worst case
await phase('heavy + sustained fire', `
  window.__wantFire = true;
`, 8000);

await phase('settled', null, 5000);

cdp.close();
close();
process.exit(0);
