// Regression suite for the code review.
//
// Every check asserts the FIXED behaviour. Run with:
//   node review.mjs
//
// A check prints PASS/FAIL per finding; the script exits non-zero if
// anything regressed.
import { launch, CDP, newPage, PAGE_URL, INDEX_PATH, TMP_PAGE } from './cdp.mjs';

const W = 1440, H = 900;
let failures = 0;
const ok = (b) => {
  if (!b) failures++;
  return b ? 'PASS' : 'FAIL';
};

const { proc, wsUrl, close } = await launch({ width: W, height: H });
const cdp = await CDP.connect(wsUrl);
const page = await newPage(cdp);
const S = page.send;
await S('Runtime.enable');
await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2500));

const ev = async (expr) => {
  const r = await S('Runtime.evaluate', {
    expression: `(() => { ${expr} })()`, returnByValue: true, awaitPromise: true
  });
  if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description };
  return r.result.value;
};
// Read a DOM text value. Returns the raw string — never JSON-parsed.
const evText = async (expr) => {
  const r = await S('Runtime.evaluate', { expression: `(() => { ${expr} })()`, returnByValue: true });
  if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description };
  return r.result.value;
};

console.log('REGRESSION SUITE — games/lumen/index.html\n');

/* 1. FPS counter must not floor at 20 */
let r = await ev(`
  LUMEN.startGame();
  window.__ft=[];
  (function m(){ let last=performance.now(); (function t(){ const n=performance.now();
    window.__ft.push(n-last); last=n; if(window.__ft.length>300) window.__ft.shift();
    requestAnimationFrame(t); })(); })();
  window.__burn=true;
  (function loop(){ if(!window.__burn) return; const t0=performance.now(); let x=0;
    while(performance.now()-t0<120){ x+=Math.sqrt(x+1.23); } requestAnimationFrame(loop); })();
  return 1;`);
await new Promise(x => setTimeout(x, 6000));
r = await ev(`
  const ft=window.__ft.slice().sort((a,b)=>a-b);
  const med=ft[Math.floor(ft.length/2)]||0;
  return { realFps:+(1000/Math.max(med,0.01)).toFixed(1), hudFps:document.getElementById('tFps').textContent };`);
await ev('window.__burn=false; return 1;');
console.log(`1. FPS counter reports the truth         ${ok(+r.realFps < 19 && +r.hudFps < 19)}`);
console.log(`   real=${r.realFps}fps  HUD shows ${r.hudFps}  (must not be pinned at 20)`);

/* 2. HUD "Draws" must be the real count.
   Count the draw calls in a SINGLE frame, then compare against what the
   HUD reports for that frame. */
r = await ev(`
  const gl = LUMEN.gl;
  const wait=()=>new Promise(r2=>requestAnimationFrame(()=>requestAnimationFrame(r2)));
  return (async()=>{
    // Let the game settle, then count exactly one frame.
    await wait();
    let calls=0;
    const rd=gl.drawArrays.bind(gl), ri=gl.drawArraysInstanced.bind(gl);
    const od=gl.drawArrays, oi=gl.drawArraysInstanced;
    gl.drawArrays=function(...a){calls++;return rd(...a);};
    gl.drawArraysInstanced=function(...a){calls++;return ri(...a);};
    await new Promise(r3=>requestAnimationFrame(r3));
    const measured=calls;
    gl.drawArrays=od; gl.drawArraysInstanced=oi;
    // The HUD shows the PREVIOUS frame's count, so read it after one more
    // frame has been drawn and published.
    await new Promise(r3=>requestAnimationFrame(()=>requestAnimationFrame(r3)));
    return { measured, hud:document.getElementById('tDrw').textContent,
             reported: LUMEN.drawCalls };
  })();`);
console.log(`2. HUD "Draws" is the real count         ${ok(+r.hud === r.measured && +r.hud === r.reported)}`);
console.log(`   measured ${r.measured} GL draw calls in one frame; HUD shows ${r.hud}, LUMEN.drawCalls=${r.reported}`);

/* 3. A new wave banner must survive the previous wave's timer.
   This drives the REAL shipped function. Wave 1's banner is shown at
   t=0 (its timer would fire at t=2200); wave 2's banner at t=100 (its
   timer fires at t=2300). The check is made at t=2250 — after wave 1's
   stale timer would have wiped it, before wave 2's real one fires.
   The old code left a stray setTimeout, so the text was '' here. */
r = await ev(`
  LUMEN.startGame();
  LUMEN.showWaveBanner(1);
  setTimeout(() => LUMEN.showWaveBanner(2), 100);
  return 1;`);
await new Promise(x => setTimeout(x, 2250));
r = await evText(`return document.getElementById("wsub").textContent;`);
console.log(`3. Wave banner not cleared early         ${ok(r === '— incoming')}`);
console.log(`   wave 2's banner at t=2250ms: ${JSON.stringify(r)} (must still be set)`);

/* 3c. After wave 2's own timer, the banner clears normally. */
await new Promise(x => setTimeout(x, 300));
r = await evText(`return document.getElementById("wsub").textContent;`);
console.log(`3c. Banner clears at its own deadline    ${ok(r === '')}`);
console.log(`   banner text at t=2550ms: ${JSON.stringify(r)}`);

/* 3b. A lone banner must still clear itself. */
await ev(`LUMEN.showWaveBanner(3); return 1;`);
await new Promise(x => setTimeout(x, 2400));
r = await evText(`return document.getElementById("wsub").textContent;`);
console.log(`3b. Lone banner clears itself            ${ok(r === '')}`);
console.log(`   banner text 2.4s after a lone banner: ${JSON.stringify(r)}`);

/* 4. F in the menu must NOT grant overdrive */
await ev(`LUMEN.S.mode='menu'; LUMEN.S.overdrive=0; return 1;`);
await ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'f',bubbles:true})); return 1;`);
await new Promise(x => setTimeout(x, 700));
r = await ev(`return { mode:LUMEN.S.mode, overdrive:LUMEN.S.overdrive, overdriveT:+LUMEN.S.overdriveT.toFixed(2) };`);
console.log(`4. "F" in the menu grants no overdrive   ${ok(r.overdrive === 0)}`);
console.log(`   after F: ${JSON.stringify(r)}`);

/* 5. Combo must not carry across a restart */
r = await ev(`
  LUMEN.startGame(); LUMEN.S.combo=11; LUMEN.S.comboT=2.4;
  LUMEN.startGame();
  return { combo:LUMEN.S.combo, comboT:+LUMEN.S.comboT.toFixed(2) };`);
console.log(`5. Combo resets on restart               ${ok(r.combo === 0)}`);
console.log(`   after restart: ${JSON.stringify(r)}`);

/* 6. Spawned enemies must not land on the player */
r = await ev(`
  LUMEN.startGame();
  const p=LUMEN.player; p.x=1100; p.y=0;
  const ring=620, limX=1150-40, limY=720-40;
  let worst=1e9;
  for(let i=0;i<5000;i++){
    const a=Math.random()*6.283, rr=0.85+Math.random()*0.4;
    let x=p.x+Math.cos(a)*ring*rr, y=p.y+Math.sin(a)*ring*rr;
    if(Math.abs(x)>limX||Math.abs(y)>limY){
      x=Math.max(-limX,Math.min(limX,x)); y=Math.max(-limY,Math.min(limY,y));
      const dx=x-p.x, dy=y-p.y, d=Math.hypot(dx,dy), minD=p.r+90;
      if(d<minD){ if(d>0.001){ x=p.x+(dx/d)*minD; y=p.y+(dy/d)*minD; } else { x=-p.x; y=-p.y; }
        x=Math.max(-limX,Math.min(limX,x)); y=Math.max(-limY,Math.min(limY,y));
        if(Math.hypot(x-p.x,y-p.y)<minD){ x=Math.max(-limX,Math.min(limX,-p.x)); y=Math.max(-limY,Math.min(limY,-p.y)); } }
    }
    const d=Math.hypot(x-p.x,y-p.y); if(d<worst)worst=d;
  }
  return { worst:+worst.toFixed(1), playerRadius:p.r };`);
console.log(`6. Enemies never spawn on the player     ${ok(r.worst >= 40)}`);
console.log(`   worst spawn distance ${r.worst} units (player radius ${r.playerRadius})`);

/* 7. Dead code removed */
r = await ev(`
  const src=document.documentElement.outerHTML;
  const c=re=>(src.match(re)||[]).length;
  return { extLin:c(/extLin/g), Sbest:c(/S\\.best/g), comboBest:c(/comboBest/g),
           clearedWave:c(/clearedWave/g), arenaR:c(/ARENA\\.r\\b/g),
           Sdt:c(/S\\.dt/g), noopBranch:c(/let start via enter/g) };`);
console.log(`7. Dead code removed                     ${ok(r.extLin===0 && r.Sbest===0 && r.comboBest===0 && r.clearedWave===0 && r.arenaR===0 && r.Sdt===0 && r.noopBranch===0)}`);
console.log(`   extLin=${r.extLin} S.best=${r.Sbest} comboBest=${r.comboBest} clearedWave=${r.clearedWave} ARENA.r=${r.arenaR} S.dt=${r.Sdt} emptyBranch=${r.noopBranch}`);

/* 8. The O(n^2) separation loop is not a defect — keep it honest */
r = await ev(`
  LUMEN.startGame(); LUMEN.enemies.length=0;
  for(let i=0;i<205;i++){ const a=Math.random()*6.283,d=200+Math.random()*700;
    LUMEN.enemies.push({x:LUMEN.player.x+Math.cos(a)*d,y:LUMEN.player.y+Math.sin(a)*d,
      vx:0,vy:0,r:20,hp:50,maxhp:50,spd:150,type:'grunt',col:[1,.3,.4],
      hit:0,fireCd:2,rot:0,seed:Math.random()*10,shoot:0,wob:0}); }
  const t0=performance.now();
  for(let k=0;k<30;k++) for(let i=0;i<LUMEN.enemies.length;i++){ const e=LUMEN.enemies[i];
    for(let j=LUMEN.enemies.length-1;j>=0;j--){ if(j===i)continue; const o=LUMEN.enemies[j];
      const dx=e.x-o.x,dy=e.y-o.y,d2=dx*dx+dy*dy; if(d2>0.01){ const d=Math.sqrt(d2); } } }
  return { msPerFrame:+((performance.now()-t0)/30).toFixed(3) };`);
console.log(`8. Separation loop stays cheap            ${ok(r.msPerFrame < 4)}`);
console.log(`   ${r.msPerFrame} ms/frame at 205 enemies`);

cdp.close(); close();

/* ------------------------------------------------------------------ */
/*  Mobile + render-path checks (need touch emulation)                */
/* ------------------------------------------------------------------ */
console.log('\n--- mobile + render-path ---\n');
const { proc: p2, wsUrl: w2, close: c2 } = await launch({ width: 1200, height: 750 });
const cdp2 = await CDP.connect(w2);
const page2 = await newPage(cdp2);
const S2 = page2.send;
await S2('Runtime.enable');
await S2('Page.enable');
await S2('Emulation.setDeviceMetricsOverride', { width: 1200, height: 750, deviceScaleFactor: 2, mobile: true });
await S2('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await S2('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2500));
const ev2 = async (expr) => {
  const r = await S2('Runtime.evaluate', { expression: `(() => { ${expr} })()`, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description };
  return r.result.value;
};

/* 9. The hidden menu card must not eat touches during play */
r = await ev2(`
  LUMEN.S.touchMode = true;
  LUMEN.startGame();
  window.dispatchEvent(new Event('touchstart'));
  const c = document.querySelector('#menu .card');
  const b = c.getBoundingClientRect();
  return { cx: Math.round(b.left + b.width*0.5), cy: Math.round(b.top + b.height*0.5),
           w: Math.round(b.width), h: Math.round(b.height),
           cardClass: c.className, cardPE: getComputedStyle(c).pointerEvents,
           menuPE: getComputedStyle(document.getElementById('menu')).pointerEvents };`);
const tap = async (x, y) => {
  await ev2(`LUMEN.Input.mouse.down = false; LUMEN.Input.touch.aimId = null; return 1;`);
  await S2('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await new Promise(t => setTimeout(t, 150));
  const v = await ev2(`return LUMEN.Input.mouse.down;`);
  await S2('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await new Promise(t => setTimeout(t, 100));
  return v;
};
const over = await tap(r.cx, r.cy);
const awayX = Math.min(1190, r.cx + r.w + 160);
const away = await tap(awayX, r.cy);
console.log(`9. Hidden menu card does not eat taps     ${ok(over && away)}`);
console.log(`   tap over card (${r.cx},${r.cy}) -> mouse.down=${over}   tap on canvas (${awayX},${r.cy}) -> mouse.down=${away}`);
console.log(`   card pointer-events: ${r.cardPE} (menu: ${r.menuPE})`);

/* 10. The card must be touch-scrollable when it overflows.

   NOTE ON THE METHOD: CDP's raw `Input.dispatchTouchEvent` does NOT drive
   the compositor's scroll gesture — verified against a plain scrollable div
   with no game involved, where the same drag left scrollTop at 0. Only
   `Input.synthesizeScrollGesture` produces a real finger scroll. Using the
   raw touch API here would have tested the harness, not the product. */
{
  await S2('Emulation.setDeviceMetricsOverride', { width: 390, height: 320, deviceScaleFactor: 2, mobile: true });
  await S2('Page.navigate', { url: '' + PAGE_URL + '' });
  await new Promise(t => setTimeout(t, 1800));
  const pre = await ev2(`
    const c = document.querySelector('#menu .card');
    return { scrollH:c.scrollHeight, clientH:c.clientHeight, overflow:c.scrollHeight-c.clientHeight,
             bodyTA:getComputedStyle(document.body).touchAction,
             canvasTA:getComputedStyle(document.getElementById('gl')).touchAction };`);
  await ev2(`document.querySelector('#menu .card').scrollTop=0; return 1;`);
  await S2('Input.synthesizeScrollGesture', {
    x: 195, y: 200, xDistance: 0, yDistance: -200, gestureSourceType: 'touch', speed: 800
  });
  await new Promise(t => setTimeout(t, 700));
  const post = await ev2(`return document.querySelector('#menu .card').scrollTop;`);
  console.log(`10. Card is touch-scrollable              ${ok(post > 0)}`);
  console.log(`    card overflows by ${pre.overflow}px; a touch scroll moved it ${post}px`);
  console.log(`    body touch-action=${pre.bodyTA}, canvas touch-action=${pre.canvasTA}`);
}

/* 11. The bloom bright pass must actually fire */
{
  const { readFileSync, writeFileSync, unlinkSync } = await import('node:fs');
  const SRC = readFileSync(INDEX_PATH, 'utf8');
  const patched = SRC
    .replace("const extFloat = gl.getExtension('EXT_color_buffer_float');",
             "const extFloat = window.__forceNoFloat ? null : gl.getExtension('EXT_color_buffer_float');")
    // Record which internal format the render targets actually got. The
    // extension being PRESENT in the browser is not the same as the game
    // having USED it — and reading an RGBA8 target with gl.FLOAT silently
    // returns zeros, which looks exactly like a dead bloom.
    .replace('RT.w=w; RT.h=h; RT.bw=bw; RT.bh=bh;',
             'RT.w=w; RT.h=h; RT.bw=bw; RT.bh=bh; RT.isFloat=useFloat;')
    .replace('const RT = { w:0, h:0,', 'const RT = { w:0, h:0, isFloat:true,')
    .replace('/* ---------- post programs ---------- */',
      'window.__RT = RT; window.__gl = gl;\n/* ---------- post programs ---------- */');
  if (!patched.includes('RT.isFloat=useFloat')) { console.log('format patch failed'); process.exit(1); }
  writeFileSync(TMP_PAGE, patched);

  const probe = async (noFloat) => {
    const { proc, wsUrl, close } = await launch({ width: 1000, height: 640 });
    const cdp = await CDP.connect(wsUrl);
    const page = await newPage(cdp);
    const S = page.send;
    await S('Runtime.enable'); await S('Page.enable');
    await S('Page.addScriptToEvaluateOnNewDocument', { source: `window.__forceNoFloat = ${noFloat};` });
    await S('Page.navigate', { url: 'file://' + TMP_PAGE });
    await new Promise(r => setTimeout(r, 2200));
    await S('Runtime.evaluate', { expression: `
      LUMEN.startGame(); LUMEN.Input.mouse.down = true;
      for (let i=0;i<16;i++) LUMEN.enemies.push({x:LUMEN.player.x+(Math.random()-.5)*600, y:LUMEN.player.y+(Math.random()-.5)*420,
        vx:0,vy:0,r:20,hp:50,maxhp:50,spd:40,type:'grunt',col:[1,.35,.45],hit:0,fireCd:2,rot:0,seed:Math.random()*10,shoot:1,wob:0});` });
    await new Promise(r => setTimeout(r, 3000));
    const res = await S('Runtime.evaluate', { expression: `(() => {
      const gl = window.__gl, RT = window.__RT;
      const useFloat = RT.isFloat;
      gl.bindFramebuffer(gl.FRAMEBUFFER, RT.bloomA);
      const b = useFloat ? new Float32Array(RT.bw*RT.bh*4) : new Uint8Array(RT.bw*RT.bh*4);
      gl.readPixels(0,0,RT.bw,RT.bh,gl.RGBA, useFloat ? gl.FLOAT : gl.UNSIGNED_BYTE, b);
      const err = gl.getError();
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      const scale = useFloat ? 1 : 1/255;
      let max=0,sum=0,bright=0; const n=b.length/4;
      for(let i=0;i<b.length;i+=4){ const l=(b[i]+b[i+1]+b[i+2])/3*scale; if(l>max)max=l; sum+=l; if(l>0.002)bright++; }
      return { format: useFloat ? 'RGBA16F' : 'RGBA8', readPixelsError: err,
               bloomMax:+max.toFixed(4), bloomMean:+(sum/n).toFixed(6), brightPixels:bright, total:n };
    })()`, returnByValue: true });
    cdp.close(); close();
    return res.result.value;
  };

  const f = await probe(false);
  const u = await probe(true);
  console.log(`11. Bloom bright pass fires (float)       ${ok(f.brightPixels > 0)}`);
  console.log(`    ${JSON.stringify(f)}`);
  console.log(`12. Bloom bright pass fires (8-bit)       ${ok(u.brightPixels > 0)}`);
  console.log(`    ${JSON.stringify(u)}`);
  console.log(`    (the old threshold of 1.05 made this path read brightPixels=0 — bloom was dead)`);
  unlinkSync(TMP_PAGE);
}

cdp2.close(); c2();

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
