import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: true });
for (const [url, sel, out] of [
  ['http://localhost:4321/', '.footer-cols', 'footer-cols'],
  ['http://localhost:4321/get-involved/', '.matching-facts', 'matching'],
]) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.goto(url, { waitUntil: 'networkidle2' });
  await p.addStyleTag({ content: `*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}
    .reveal,.rise,.stagger>*{opacity:1!important;transform:none!important}` });
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-visible')));
  const el = await p.$(sel); await el.scrollIntoView();
  await el.screenshot({ path: `temporary screenshots/${out}.png` });
  console.log('  wrote ' + out);
  await p.close();
}
await b.close();
