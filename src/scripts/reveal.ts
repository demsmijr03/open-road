/**
 * Scroll reveals.
 *
 * One observer, elements unobserved once shown. Roughly a kilobyte, against the
 * ~50KB a motion library would cost for the same effect.
 *
 * Two failure modes this guards against, both of which hide content:
 *
 *   1. No IntersectionObserver. Everything is revealed immediately.
 *   2. Client-side navigation. With <ClientRouter /> active a DOMContentLoaded
 *      listener fires once, on the first page only. Every page navigated to
 *      afterwards would arrive with its content still at opacity 0. Hence
 *      astro:page-load, which fires on the initial load *and* every swap.
 *
 * The `js-reveal` class on <html> is what arms the CSS at all. It is set here
 * rather than in the markup so that if this script never runs, the hidden state
 * is never applied and the page is simply visible.
 */
function armReveals() {
  const root = document.documentElement;
  const targets = document.querySelectorAll<HTMLElement>('.reveal');
  if (targets.length === 0) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    root.classList.add('js-reveal');
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  root.classList.add('js-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    // Fires a little before the element reaches the bottom edge, so the motion
    // reads as the page settling rather than as content arriving late.
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
  );

  targets.forEach((el) => {
    // Anything already on screen at load is shown without animating, so the
    // first viewport never flickers.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add('is-visible');
    } else {
      observer.observe(el);
    }
  });
}

document.addEventListener('astro:page-load', armReveals);
