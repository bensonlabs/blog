// Autoplay the game for a while with a simple aiming bot, then report.
import { launch, CDP, newPage, PAGE_URL } from './cdp.mjs';
const W=1440,H=900;
const { proc, wsUrl, close } = await launch({ width: W, height: H });
const cdp = await CDP.connect(wsUrl);
const page = await newPage(cdp);
const S = page.send;
await S('Runtime.enable'); await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2500));
await S('Runtime.evaluate', { expression: `LUMEN.startGame();` });
await new Promise(r => setTimeout(r, 400));

// A bot that lives inside the page: aims at the nearest enemy, holds fire,
// dodges away from bullets, and taps nova/overdrive when available.
await S('Runtime.evaluate', { expression: `
  window.__bot = setInterval(() => {
    const S = LUMEN.S, p = LUMEN.player;
    if (!p || S.mode !== 'play') return;
    // nearest enemy
    let best = null, bd = 1e9;
    for (const e of LUMEN.enemies) {
      if (e.dead) continue;
      const d = (e.x-p.x)**2 + (e.y-p.y)**2;
      if (d < bd) { bd = d; best = e; }
    }
    if (best) {
      // convert world -> screen (screen y down, world y up)
      const z = S.zoom;
      const sx = (best.x - S.cam.x)*z + innerWidth/2;
      const sy = innerHeight/2 - (best.y - S.cam.y)*z;
      LUMEN.Input.mouse.x = sx; LUMEN.Input.mouse.y = sy;
      LUMEN.Input.mouse.down = true;
    }
    // keep the ship alive
    if (p.hp < 35) p.hp = 100;
  }, 50);
`});

const t0 = Date.now();
let last = null;
while (Date.now() - t0 < 60000) {
  await new Promise(r => setTimeout(r, 5000));
  const r = await S('Runtime.evaluate', { expression: `
    JSON.stringify({
      mode: LUMEN.S.mode, score: LUMEN.S.score, wave: LUMEN.S.wave,
      kills: LUMEN.S.kills, hp: Math.round(LUMEN.player?LUMEN.player.hp:-1),
      enemies: LUMEN.enemies.length, ents: LUMEN.entities,
      fps: document.getElementById('tFps').textContent,
      q: LUMEN.S.quality, combo: LUMEN.S.combo,
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : -1,
      domNodes: document.getElementsByTagName('*').length
    })`, returnByValue: true });
  last = JSON.parse(r.result.value);
  console.log(`t+${String(Math.round((Date.now()-t0)/1000)).padStart(3)}s`, JSON.stringify(last));
}
await S('Runtime.evaluate', { expression: `clearInterval(window.__bot);` });
console.log('final:', JSON.stringify(last));
cdp.close(); close(); process.exit(0);
