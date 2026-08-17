/**
 * Scroll-condensing header guarantees.
 *
 *   npm run dev
 *   node scripts/verify-header.mjs
 *
 * The header carries transition:persist and its script binds a scroll listener
 * at module scope, which is the arrangement most likely to rot silently. These
 * are the four ways it can break without anyone noticing:
 *
 *   1. JS off leaves the bar unusable. It must render expanded and complete.
 *   2. The bar unpins and scrolls away, which makes condensing pointless.
 *   3. A client-side navigation arrives at the top still carrying is-condensed,
 *      because the persisted element kept the previous page's class.
 *   4. Anchor targets land underneath the pinned bar.
 *
 * Exits 1 on any failure.
 */
import puppeteer from 'puppeteer';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const DESKTOP = { width: 1440, height: 900 };

let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const browser = await puppeteer.launch({ headless: true });

try {
  // --- 1. JS disabled: the bar is whole ------------------------------------
  {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE}/award/`, { waitUntil: 'load', timeout: 60_000 });

    const state = await page.evaluate(() => {
      const header = document.querySelector('.header');
      const links = [...document.querySelectorAll('.header-nav a')];
      const visible = links.filter((a) => {
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== 'hidden';
      });
      return {
        condensed: header?.classList.contains('is-condensed') ?? null,
        total: links.length,
        visible: visible.length,
        headerH: Math.round(header?.getBoundingClientRect().height ?? 0),
      };
    });

    check(state.condensed === false, 'JS off  header renders expanded', `is-condensed=${state.condensed}`);
    check(
      state.total > 0 && state.visible === state.total,
      'JS off  every nav link is visible',
      `${state.visible} of ${state.total}`
    );
    check(state.headerH > 40, 'JS off  header has real height', `${state.headerH}px`);
    await page.close();
  }

  // --- 2. Condenses on scroll and stays pinned -----------------------------
  for (const route of ['/', '/award/']) {
    const page = await browser.newPage();
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 60_000 });

    const atRest = await page.evaluate(() => {
      const h = document.querySelector('.header');
      return { condensed: h.classList.contains('is-condensed'), h: Math.round(h.getBoundingClientRect().height) };
    });

    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForFunction(() => document.querySelector('.header').classList.contains('is-condensed'), {
      timeout: 4000,
      polling: 100,
    }).catch(() => {});

    const scrolled = await page.evaluate(() => {
      const h = document.querySelector('.header');
      const r = h.getBoundingClientRect();
      const cs = getComputedStyle(h);
      return {
        condensed: h.classList.contains('is-condensed'),
        top: Math.round(r.top),
        h: Math.round(r.height),
        bg: cs.backgroundColor,
      };
    });

    check(!atRest.condensed, `${route} not condensed at rest`);
    check(scrolled.condensed, `${route} condenses after scrolling`);
    check(Math.abs(scrolled.top) <= 1, `${route} stays pinned to the top`, `top=${scrolled.top}px`);
    check(
      scrolled.h < atRest.h,
      `${route} is shorter once condensed`,
      `${atRest.h}px to ${scrolled.h}px`
    );
    // A transparent bar over content would leave white labels on whatever
    // scrolls beneath it.
    const opaque = !/rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(scrolled.bg);
    check(opaque, `${route} condensed bar has a background`, scrolled.bg);
    await page.close();
  }

  // --- 3. Resyncs across a client-side navigation --------------------------
  {
    const page = await browser.newPage();
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60_000 });

    // Scroll, condense, then navigate. The header element itself survives.
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForFunction(() => document.querySelector('.header').classList.contains('is-condensed'), {
      timeout: 4000,
      polling: 100,
    });

    await page.evaluate(() => {
      const link = [...document.querySelectorAll('.header-nav a')].find((a) =>
        a.getAttribute('href')?.startsWith('/about')
      );
      link.click();
    });
    await page.waitForFunction(() => location.pathname.startsWith('/about'), {
      timeout: 15_000,
      polling: 100,
    });
    await new Promise((r) => setTimeout(r, 400));

    const after = await page.evaluate(() => ({
      condensed: document.querySelector('.header').classList.contains('is-condensed'),
      y: Math.round(window.scrollY),
    }));
    check(
      !after.condensed || after.y > 24,
      'soft nav  condensed state resyncs on arrival',
      `is-condensed=${after.condensed} at scrollY=${after.y}`
    );

    // Scroll again on the new page: the module-scope listener must still work
    // and must not have been stacked into a broken state.
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForFunction(() => document.querySelector('.header').classList.contains('is-condensed'), {
      timeout: 4000,
      polling: 100,
    }).catch(() => {});
    const stillWorks = await page.evaluate(() =>
      document.querySelector('.header').classList.contains('is-condensed')
    );
    check(stillWorks, 'soft nav  still condenses on the page navigated to');
    await page.close();
  }

  // --- 3b. Condensing must not move the page under the reader --------------
  // The sticky bar is in flow, so shrinking it once shortened the document and
  // pulled everything below up by the padding it gave up: a 16px jump on the
  // first wheel notch. Driven with real wheel deltas because scrollTo sets an
  // absolute position each call and hides the shift entirely.
  for (const route of ['/', '/award/', '/about/', '/get-involved/']) {
    const page = await browser.newPage();
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 60_000 });
    await page.evaluate(() => {
      window.__log = [];
      const h = document.querySelector('.header');
      const probe = document.querySelector('main');
      const tick = () => {
        window.__log.push({
          y: Math.round(window.scrollY),
          top: Math.round(probe.getBoundingClientRect().top),
          hh: Math.round(h.getBoundingClientRect().height),
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.mouse.move(700, 500);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel({ deltaY: 12 });
      await new Promise((r) => setTimeout(r, 90));
    }
    await new Promise((r) => setTimeout(r, 250));
    const log = await page.evaluate(() => window.__log);

    let worst = 0;
    for (let i = 1; i < log.length; i++) {
      // content should move up exactly as far as the page scrolls, no more
      const unexplained = log[i].top - log[i - 1].top + (log[i].y - log[i - 1].y);
      if (Math.abs(unexplained) > Math.abs(worst)) worst = unexplained;
    }
    const shrank = new Set(log.map((l) => l.hh)).size > 1;
    check(Math.abs(worst) <= 2, `${route} content does not jump while condensing`, `worst=${worst}px`);
    check(shrank, `${route} bar still changes height`, [...new Set(log.map((l) => l.hh))].join(' to '));
    await page.close();
  }

  // --- 3c. The phone header stays two tidy rows -----------------------------
  // It was three, each on a different alignment, and 208px of an 844px screen.
  // Both rows must now span the same gutters, and the brand and the button must
  // share row one, because a third row is what pushed the header into the hero.
  for (const [w, h] of [[360, 780], [390, 844], [393, 852], [412, 915], [430, 932]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60_000 });
    const r = await page.evaluate(() => {
      const brand = document.querySelector('.header-brand').getBoundingClientRect();
      const cta = document.querySelector('.header-cta').getBoundingClientRect();
      // The <ul> carries a negative inline margin so the links' own padding
      // does not inset their labels; its box therefore sits ~6px outside the
      // gutter on purpose. What has to line up is the TEXT, so measure that.
      const linkEls = [...document.querySelectorAll('.header-nav a')];
      const textBox = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
      const navTextLeft = textBox(linkEls[0]).left;
      const navTextRight = textBox(linkEls[linkEls.length - 1]).right;
      const hd = document.querySelector('.header').getBoundingClientRect();
      const eb = document.querySelector('.hero .eyebrow, .hero [class*=eyebrow]').getBoundingClientRect();
      const links = linkEls.map((a) => {
        const b = a.getBoundingClientRect();
        return { w: Math.round(b.width), h: Math.round(b.height) };
      });
      return {
        sameRow: Math.abs(brand.top - cta.top) < 4,
        headerH: Math.round(hd.height),
        navLeft: Math.round(navTextLeft),
        brandLeft: Math.round(brand.left),
        navRight: Math.round(navTextRight),
        ctaRight: Math.round(cta.right),
        gap: Math.round(eb.top - hd.bottom),
        smallest: Math.min(...links.map((l) => l.w)),
        shortest: Math.min(...links.map((l) => l.h)),
      };
    });
    check(r.sameRow, `@${w} brand and button share a row`, `header ${r.headerH}px`);
    check(Math.abs(r.navLeft - r.brandLeft) <= 2, `@${w} rows share a left edge`, `nav ${r.navLeft} vs brand ${r.brandLeft}`);
    check(Math.abs(r.navRight - r.ctaRight) <= 2, `@${w} rows share a right edge`, `nav ${r.navRight} vs cta ${r.ctaRight}`);
    check(r.gap >= 24, `@${w}x${h} hero eyebrow clears the header`, `${r.gap}px`);
    check(r.smallest >= 44 && r.shortest >= 44, `@${w} every nav target is 44px+`, `${r.smallest}x${r.shortest}`);
    await page.close();
  }

  // --- 4. Anchor targets clear the pinned bar ------------------------------
  {
    const page = await browser.newPage();
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE}/get-involved/#partner`, { waitUntil: 'networkidle2', timeout: 60_000 });
    await new Promise((r) => setTimeout(r, 600));

    const clearance = await page.evaluate(() => {
      const target = document.querySelector('#partner');
      const header = document.querySelector('.header');
      const hb = header.getBoundingClientRect();
      const tb = target.getBoundingClientRect();
      const pinned = getComputedStyle(header).position;
      return { gap: Math.round(tb.top - hb.bottom), pinned };
    });
    check(
      clearance.gap >= 0,
      'anchor target is not hidden behind the bar',
      `gap=${clearance.gap}px, header ${clearance.pinned}`
    );
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nHeader guarantees hold.' : `\n${failures} failure(s).`);
if (failures > 0) process.exit(1);
