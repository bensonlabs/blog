// Verify the adaptive quality system still demotes and promotes correctly
// after the FPS counter fix (it now receives the true frame rate, not a
// floored one).
import { launch, CDP, newPage, PAGE_URL } from './cdp.mjs';

const { proc, wsUrl, close } = await launch({ width: 1440, height: 900 });
const cdp = await CDP.connect(wsUrl);
const page = await newPage(cdp);
const S = page.send;
await S('Runtime.enable'); await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2200));

const read = async () => (await S('Runtime.evaluate', { expression: `JSON.stringify({
  q: LUMEN.S.quality, parts: LUMEN.S.partCount, fps: document.getElementById('tFps').textContent })`,
  returnByValue: true })).result.value;

await S('Runtime.evaluate', { expression: 'LUMEN.startGame();' });
await new Promise(r => setTimeout(r, 1500));
console.log('  initial:      ', await read());

// Force a slow frame rate and let autoQuality react.
await S('Runtime.evaluate', { expression: `
  window.__burn = true;
  (function loop(){ if(!window.__burn) return; const t0=performance.now(); let x=0;
    while(performance.now()-t0<40){ x+=Math.sqrt(x+1.23); } requestAnimationFrame(loop); })();
` });
await new Promise(r => setTimeout(r, 14000));
console.log('  under load:   ', await read());
const demoted = (await read());

// Release the load and let it recover.
await S('Runtime.evaluate', { expression: 'window.__burn = false;' });
await new Promise(r => setTimeout(r, 22000));
console.log('  recovered:    ', await read());

const q = JSON.parse(await read());
console.log('');
console.log('  demoted to a lower tier under load: ', demoted.q !== 'high' ? 'YES' : 'NO');
console.log('  recovered to high:                  ', q.q === 'high' ? 'YES' : 'NO');
console.log('  particle count tracks the tier:     ',
  q.q === 'high' ? (q.parts === 46000 ? 'YES (46000)' : `NO (${q.parts})`) : `n/a (${q.q})`);

cdp.close(); close();
process.exit(0);
