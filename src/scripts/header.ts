/**
 * Scroll-condensing header.
 *
 * Adds `is-condensed` to <header> once the page has scrolled past a small
 * threshold. Everything the class does is in Header.astro's stylesheet: this
 * file only decides when it is on.
 *
 * Three things make this less trivial than it looks here.
 *
 *   1. The header carries `transition:persist`, so it survives a client-side
 *      navigation. The scroll listener is therefore bound once at module scope,
 *      not inside the page-load handler. Binding it per page-load would stack a
 *      new listener on every navigation, and there would be no matching
 *      reference to remove, since each call creates a new closure.
 *
 *   2. `astro:page-load` still has to run, to resync. Astro restores scroll
 *      position on a swap, so a page arriving at the top must drop the class
 *      that the previous page left on the persisted element.
 *
 *   3. This is decoration and nothing else. With JavaScript off the class is
 *      never added, and the header renders in its expanded state with every
 *      link and button working. Nothing is hidden pending a script, which is
 *      the rule the whole motion system is built around.
 *
 * Reduced motion needs no branch here: the global reduce rule already collapses
 * transition durations, so the state change lands instantly rather than fading.
 */

/** Roughly one line of scroll. Enough that a trackpad twitch does not toggle it. */
const CONDENSE_AT = 24;

let header: HTMLElement | null = null;
let ticking = false;

function update() {
  ticking = false;
  header?.classList.toggle('is-condensed', window.scrollY > CONDENSE_AT);
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

function arm() {
  header = document.querySelector<HTMLElement>('.header');
  update();
}

window.addEventListener('scroll', onScroll, { passive: true });
document.addEventListener('astro:page-load', arm);
