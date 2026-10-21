// Capture the mobile menu and mobile gameplay, to confirm the touch
// legend and the card still lay out correctly after the CSS changes.
import { launch, CDP, newPage, PAGE_URL, outPath } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const shoot = async (name, w, h, after) => {
  const { proc, wsUrl, close } = await launch({ width: w, height: h });
  const cdp = await CDP.connect(wsUrl);
  const page = await newPage(cdp);
  const S = page.send;
  await S('Runtime.enable'); await S('Page.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await S('Page.navigate', { url: '' + PAGE_URL + '' });
  await new Promise(r => setTimeout(r, 2200));
  if (after) {
    await S('Runtime.evaluate', { expression: after });
    await new Promise(r => setTimeout(r, 2500));
  }
  const b64 = (await S('Page.captureScreenshot', { format: 'png' })).data;
  writeFileSync(outPath(name + '.png'), Buffer.from(b64, 'base64'));
  const info = (await S('Runtime.evaluate', { expression: `(() => {
    const c = document.querySelector('#menu .card');
    const b = document.getElementById('playBtn').getBoundingClientRect();
    return { cardOverflow: c.scrollHeight - c.clientHeight, btnTop: Math.round(b.top),
             btnBottom: Math.round(b.bottom), vh: innerHeight,
             btnReachable: b.bottom <= innerHeight && b.top >= 0,
             touchLegendVisible: !document.getElementById('touchKeys').hidden,
             mode: LUMEN.S.mode };
  })()`, returnByValue: true })).result.value;
  cdp.close(); close();
  console.log(`  ${name}: ${JSON.stringify(info)}`);
};

console.log('mobile screenshots:');
await shoot('lum-menu-phone', 390, 844, null);
await shoot('lum-menu-short', 390, 320, null);
await shoot('lum-play-phone', 390, 844, `
  LUMEN.S.touchMode = true;
  LUMEN.startGame();
  LUMEN.Input.mouse.down = true;
`);
process.exit(0);
