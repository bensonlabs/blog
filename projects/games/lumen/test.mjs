import { launch, CDP, newPage, PAGE_URL, outPath } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const W = 1440, H = 900;
const { proc, port, wsUrl, close } = await launch({ width: W, height: H });
const cdp = await CDP.connect(wsUrl);
const page = await newPage(cdp);
const S = page.send;

const errors = [], consoleMsgs = [];
cdp.on(msg => {
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    errors.push('EXCEPTION: ' + (d.exception?.description || d.text));
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map(a => a.value ?? a.description ?? a.type).join(' ');
    consoleMsgs.push(msg.params.type + ': ' + text);
    if (msg.params.type === 'error') errors.push('CONSOLE: ' + text);
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    errors.push('LOG: ' + msg.params.entry.text);
  }
});

await S('Runtime.enable');
await S('Log.enable');
await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 3000));

// ---- probe page state ----
const probe = await S('Runtime.evaluate', {
  expression: `(() => {
    try {
      const c = document.getElementById('gl');
      const gl = c.getContext('webgl2');
      return JSON.stringify({
        mode: typeof LUMEN !== "undefined" ? LUMEN.S.mode : 'NO-S',
        canvasW: c.width, canvasH: c.height,
        glOk: !!gl,
        renderer: gl ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL || gl.RENDERER) : null,
        floatBuf: !!gl?.getExtension('EXT_color_buffer_float'),
        bootGone: document.getElementById('boot').classList.contains('gone'),
        menuOn: document.getElementById('menu').classList.contains('on')
      });
    } catch(e) { return 'ERR ' + e.message; }
  })()`, returnByValue: true
});
console.log('PROBE:', probe.result.value);

async function shot(name) {
  const { data } = await S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(outPath(name), Buffer.from(data, 'base64'));
  console.log('saved', name);
}
await shot('shot-01-menu.png');

// ---- start the game ----
await S('Runtime.evaluate', { expression: `document.getElementById('playBtn').click()` });
await new Promise(r => setTimeout(r, 1500));
await shot('shot-02-play.png');

// simulate input: move + fire, and actively aim at the nearest enemy
await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1000, y: 300 });
await S('Input.dispatchMouseEvent', { type: 'mousePressed', x: 1000, y: 300, button: 'left', clickCount: 1 });

// A simple bot: steer toward the nearest enemy, keep the mouse on it.
async function bot(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const info = await S('Runtime.evaluate', {
      expression: `(() => {
        const p = LUMEN.player, es = LUMEN.enemies;
        if (!p || !es.length) return JSON.stringify({x:0,y:0,has:false});
        let best = es[0], bd = 1e9;
        for (const e of es) { const d = Math.hypot(e.x-p.x, e.y-p.y); if (d<bd){bd=d;best=e;} }
        return JSON.stringify({x:best.x, y:best.y, has:true, d:bd, px:p.x, py:p.y});
      })()`, returnByValue: true
    });
    const t = JSON.parse(info.result.value);
    if (t.has) {
      // world -> screen (CSS px), camera at player
      const scr = await S('Runtime.evaluate', {
        expression: `(() => {
          const p = LUMEN.player, S = LUMEN.S;
          const sx = (${t.x} - S.cam.x)*S.zoom + innerWidth/2;
          const sy = (${t.y} - S.cam.y)*S.zoom + innerHeight/2;
          return JSON.stringify({sx, sy});
        })()`, returnByValue: true
      });
      const p2 = JSON.parse(scr.result.value);
      await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.max(1, Math.min(W - 1, p2.sx)), y: Math.max(1, Math.min(H - 1, p2.sy)) });
    }
    await new Promise(r => setTimeout(r, 60));
  }
}
await bot(6000);
await shot('shot-03-combat.png');

const st = await S('Runtime.evaluate', {
  expression: `JSON.stringify({ mode:LUMEN.S.mode, score:LUMEN.S.score, wave:LUMEN.S.wave, enemies:LUMEN.enemies.length, bullets:LUMEN.bullets.length, kills:LUMEN.S.kills, hp:LUMEN.player.hp, fps:document.getElementById("tFps").textContent })`,
  returnByValue: true
});
console.log('STATE:', st.result.value);

// ---- trigger nova + overdrive ----
await S('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyR', key: 'r', windowsVirtualKeyCode: 82 });
await S('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyR', key: 'r', windowsVirtualKeyCode: 82 });
await new Promise(r => setTimeout(r, 300));
await shot('shot-04-nova.png');

await S('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyF', key: 'f', windowsVirtualKeyCode: 70 });
await S('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyF', key: 'f', windowsVirtualKeyCode: 70 });
await new Promise(r => setTimeout(r, 700));
await shot('shot-05-overdrive.png');

// ---- long run: let waves progress ----
await new Promise(r => setTimeout(r, 4000));
const st2 = await S('Runtime.evaluate', {
  expression: `JSON.stringify({ mode:LUMEN.S.mode, score:LUMEN.S.score, wave:LUMEN.S.wave, enemies:LUMEN.enemies.length, kills:LUMEN.S.kills, hp:LUMEN.player.hp, heat:LUMEN.S.heat })`,
  returnByValue: true
});
console.log('STATE2:', st2.result.value);
await shot('shot-06-later.png');

// ---- if dead, capture the game over screen ----
const over = await S('Runtime.evaluate', {
  expression: `LUMEN.S.mode === 'over' ? 1 : 0`, returnByValue: true
});
if (over.result.value) {
  await new Promise(r => setTimeout(r, 900));
  await shot('shot-07-gameover.png');
  console.log('captured game over screen');
}

// ---- perf: measure real frame times ----
const perf = await S('Runtime.evaluate', {
  expression: `new Promise(res => {
    const ts = [];
    let last = performance.now(), n = 0;
    function tick(){
      const now = performance.now();
      ts.push(now - last); last = now; n++;
      if (n < 90) requestAnimationFrame(tick);
      else {
        ts.sort((a,b)=>a-b);
        res(JSON.stringify({
          median: +ts[45].toFixed(2),
          p95: +ts[85].toFixed(2),
          max: +ts[89].toFixed(2),
          fps: +(1000/ts[45]).toFixed(1)
        }));
      }
    }
    requestAnimationFrame(tick);
  })`, awaitPromise: true, returnByValue: true
});
console.log('PERF(ms):', perf.result.value);

console.log('\n=== ERRORS (' + errors.length + ') ===');
console.log(errors.slice(0, 25).join('\n') || 'none');
console.log('\n=== CONSOLE (' + consoleMsgs.length + ') ===');
console.log(consoleMsgs.slice(0, 15).join('\n') || 'none');

cdp.close();
close();
process.exit(0);
