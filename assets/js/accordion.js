/* ═══════════════════════════════════════════════════════════════════════
   Scroll accordion — spring driven.

   Scroll position does NOT drive the animation directly. It only decides
   WHICH item should be open (a whole number). A critically damped spring
   then carries a continuous `pos` toward that number, and `--open` per
   item falls out of it as  clamp(1 - |pos - i|, 0, 1).

   That indirection is the whole point: a scroll-linked animation is
   welded to your finger and can never feel heavy. A spring has mass, so
   it leans into the move and settles out of it — the old Flash feel.

   Because neighbouring items share the distance, open(i) + open(i+1)
   is always exactly 1: one panel's worth of height at any moment, so
   the layout never jumps.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  /* ── Feel. These four numbers are the entire personality. ──────────── */
  const K         = 32;    // stiffness — lower = heavier, slower pull
  const MASS      = 1.35;  // inertia   — higher = more reluctant to start
  const DAMPING   = 2 * Math.sqrt(K * MASS);   // critical: settles, never wobbles
  const HYSTERESIS= 0.55;  // how far past the midpoint before it commits
  const DRAG      = 34;    // px the artwork lags behind at full speed

  /* ?v=open stands every teaser open in normal flow — no track to read,
     no stage to pin, nothing for the spring to carry. */
  if (document.documentElement.dataset.variant === 'open') return;

  const items = [...document.querySelectorAll('.acc__item')];
  const track = document.querySelector('.acc__track');
  const stage = document.querySelector('.acc__stage');
  const list  = document.querySelector('.acc__list');
  if (!track || !stage || items.length < 2) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('acc-static');
    return;
  }

  const last = items.length - 1;
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

  let target = 0;     // the item the scroll position asks for
  let pos    = 0;     // where the spring actually is
  let vel    = 0;
  let raf    = null;
  let prev   = 0;

  /* Scroll → target index. Mirrors a view-timeline's `contain` range:
     0 when the sticky stage pins, 1 when it unpins.

     The stage does not pin at the top of the window — it pins under the
     sticky utility bar. Both ends of the range have to be read off the
     stage itself rather than off innerHeight, or the hand-off between
     items runs one bar-height late and the last item never quite
     arrives.                                                            */
  function readScroll() {
    const r = track.getBoundingClientRect();
    const pin = parseFloat(getComputedStyle(stage).top) || 0;
    const travel = r.height - stage.offsetHeight;
    if (travel <= 0) return;
    const raw = clamp01((pin - r.top) / travel) * last;

    /* Hysteresis stops the state flickering on the boundary. Looping
       lets a fast flick hand off through several items at once.        */
    const was = target;
    while (raw > target + HYSTERESIS && target < last) target++;
    while (raw < target - HYSTERESIS && target > 0)    target--;
    if (target !== was) announce();
  }

  /* The nav underlines whichever section is current; this is the only
     place that knows which one that is here. */
  function announce() {
    dispatchEvent(new CustomEvent('section',
      { detail: { topic: items[target].dataset.topic } }));
  }

  function paint() {
    for (let i = 0; i < items.length; i++) {
      items[i].style.setProperty('--open', clamp01(1 - Math.abs(pos - i)).toFixed(4));
    }
    /* Signed speed for lag, unsigned for the motion smear. Together they
       are what actually reads as weight.                               */
    const n = Math.max(-1, Math.min(1, vel / 5.5));
    list.style.setProperty('--vel', (n * DRAG).toFixed(2) + 'px');
    list.style.setProperty('--speed', Math.abs(n).toFixed(3));
  }

  function tick(now) {
    const dt = Math.min(0.032, (now - prev) / 1000) || 0.016;
    prev = now;

    const a = (-K * (pos - target) - DAMPING * vel) / MASS;
    vel += a * dt;
    pos += vel * dt;

    paint();

    if (Math.abs(pos - target) > 0.0004 || Math.abs(vel) > 0.0004) {
      raf = requestAnimationFrame(tick);
    } else {                       // snap to rest and stop burning frames
      pos = target; vel = 0; raf = null; paint();
      list.classList.remove('is-moving');
    }
  }

  function wake() {
    readScroll();
    if (raf === null) {
      list.classList.add('is-moving');   // promotes the artwork only while it moves
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', wake);
  readScroll();
  paint();
  announce();

  /* Keyboard + click access to the same state machine. */
  items.forEach((el, i) => el.querySelector('.acc__title').addEventListener('click', () => {
    const r = track.getBoundingClientRect();
    const pin = parseFloat(getComputedStyle(stage).top) || 0;
    const travel = r.height - stage.offsetHeight;
    scrollTo({ top: scrollY + r.top - pin + (i / last) * travel, behavior: 'smooth' });
  }));
})();
