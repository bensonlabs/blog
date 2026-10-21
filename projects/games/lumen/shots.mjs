// Capture all game states for visual review.
import { launch, CDP, newPage, PAGE_URL, outPath } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

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

const shot = async (name) => {
  const { data } = await S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(outPath(name), Buffer.from(data, 'base64'));
  console.log('saved', name);
};
const key = async (type, code, k) => S('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) });
const tap = async (code, k) => { await key('keyDown', code, k); await key('keyUp', code, k); };

// --- 1. menu
await shot('cap-1-menu.png');

// --- 2. mid-combat with enemies
await S('Runtime.evaluate', { expression: `LUMEN.startGame()` });
await new Promise(r => setTimeout(r, 300));

// spawn a deliberate scene: mixed enemy types around the player
await S('Runtime.evaluate', { expression: `
  LUMEN.S.autoQuality = false;
  const p = LUMEN.player;
  const kinds = [['grunt',0],['grunt',1.2],['swarm',2.1],['turret',3.4],['swarm',4.0],['grunt',5.1],['turret',5.8]];
  kinds.forEach(([k,a],i) => {
    const d = 260 + i*55;
    LUMEN.enemies.push({x:p.x+Math.cos(a)*d, y:p.y+Math.sin(a)*d, vx:0, vy:0,
      r: k==='turret'?30:(k==='swarm'?16:21), hp:50, maxhp:50, spd:150, type:k,
      col: k==='turret'?[0.7,0.4,1]:(k==='swarm'?[1,0.62,0.2]:[1,0.32,0.42]),
      hit:0, fireCd:1.2, rot:a, seed:i, shoot: k==='turret'?1.4:(k==='grunt'?2.4:0), wob:i});
  });
  // some enemy bullets in flight
  for (let i=0;i<10;i++){
    const a = i*0.63;
    LUMEN.ebullets.push({x:p.x+Math.cos(a)*400, y:p.y+Math.sin(a)*400,
      vx:-Math.cos(a)*420, vy:-Math.sin(a)*420, r:6, life:3, dmg:9});
  }
  // player bullets
  for (let i=0;i<7;i++){
    const a = -0.5 + i*0.16;
    LUMEN.bullets.push({x:p.x+Math.cos(a)*120, y:p.y+Math.sin(a)*120,
      vx:Math.cos(a)*1250, vy:Math.sin(a)*1250, r:4, life:1, dmg:12});
  }
  // a pickup
  LUMEN.pickups.push({x:p.x+150, y:p.y-120, vx:0, vy:0, type:'hp', life:20, r:12});
  LUMEN.S.score = 12480; LUMEN.S.wave = 4; LUMEN.S.combo = 5; LUMEN.S.comboT = 2;
`});
await new Promise(r => setTimeout(r, 900));
await shot('cap-2-combat.png');

// --- 3. nova shockwave
await tap('KeyR', 'r');
await new Promise(r => setTimeout(r, 220));
await shot('cap-3-nova.png');

// --- 4. overdrive
await tap('KeyF', 'f');
await new Promise(r => setTimeout(r, 500));
await shot('cap-4-overdrive.png');

// --- 5. debug overlay
await tap('KeyG', 'g');
await new Promise(r => setTimeout(r, 400));
await shot('cap-5-debug.png');
await tap('KeyG', 'g');

// --- 6. pause
await S('Runtime.evaluate', { expression: `LUMEN.S.mode='pause'; document.getElementById('pause').classList.add('on');` });
await new Promise(r => setTimeout(r, 500));
await shot('cap-6-pause.png');

// --- 7. game over
await S('Runtime.evaluate', { expression: `
  LUMEN.S.mode='over';
  document.getElementById('pause').classList.remove('on');
  document.getElementById('gameover').classList.add('on');
  document.getElementById('fScore').textContent = '24,860';
  document.getElementById('fWave').textContent = '7';
  document.getElementById('fTime').textContent = '184s';
  document.getElementById('fKill').textContent = '312';
  document.getElementById('goSub').textContent = '★ NEW HIGH SCORE ★';
  document.getElementById('hud').classList.remove('on');
`});
await new Promise(r => setTimeout(r, 600));
await shot('cap-7-gameover.png');

// --- 8. mobile viewport
await S('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2500));
await shot('cap-8-mobile-menu.png');
await S('Runtime.evaluate', { expression: `LUMEN.startGame()` });
await new Promise(r => setTimeout(r, 2000));
await shot('cap-9-mobile-play.png');

cdp.close();
close();
process.exit(0);
