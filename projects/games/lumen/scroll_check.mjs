// Verify that on a short viewport, a finger scroll reveals the ENGAGE
// button (the whole point of the .scrollable fix).
import { launch, CDP, newPage, PAGE_URL } from './cdp.mjs';

const { proc, wsUrl, close } = await launch({ width: 390, height: 320 });
const cdp = await CDP.connect(wsUrl);
const page = await newPage(cdp);
const S = page.send;
await S('Runtime.enable'); await S('Page.enable');
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 320, deviceScaleFactor: 2, mobile: true });
await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await S('Page.navigate', { url: '' + PAGE_URL + '' });
await new Promise(r => setTimeout(r, 2200));

const read = async () => (await S('Runtime.evaluate', { expression: `(() => {
  const b = document.getElementById('playBtn').getBoundingClientRect();
  const c = document.querySelector('#menu .card');
  return { scrollTop: c.scrollTop, btnTop: Math.round(b.top), btnBottom: Math.round(b.bottom),
           vh: innerHeight, fullyVisible: b.bottom <= innerHeight && b.top >= 0 };
})()`, returnByValue: true })).result.value;

console.log('before scroll:', JSON.stringify(await read()));

// A real finger scroll. CDP's raw dispatchTouchEvent does not drive the
// compositor's scroll gesture (verified against a plain div), so the
// gesture-synthesis command is the one that produces a genuine scroll.
await S('Input.synthesizeScrollGesture', {
  x: 195, y: 200, xDistance: 0, yDistance: -200, gestureSourceType: 'touch', speed: 800
});
await new Promise(r => setTimeout(r, 700));

const after = await read();
console.log('after  scroll:', JSON.stringify(after));
console.log(after.fullyVisible
  ? '  -> ENGAGE is now fully visible after a finger scroll'
  : '  -> STILL NOT VISIBLE after scrolling');

// And the button must actually work.
if (after.fullyVisible) {
  const b = (await S('Runtime.evaluate', { expression: `(() => {
    const r = document.getElementById('playBtn').getBoundingClientRect();
    return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) };
  })()`, returnByValue: true })).result.value;
  await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y }] });
  await new Promise(r => setTimeout(r, 80));
  await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await new Promise(r => setTimeout(r, 600));
  const mode = (await S('Runtime.evaluate', { expression: 'LUMEN.S.mode', returnByValue: true })).result.value;
  console.log(`  tapping ENGAGE -> mode = ${mode} ${mode === 'play' ? '(the game starts)' : '(FAILED)'}`);
}

cdp.close(); close();
process.exit(0);
