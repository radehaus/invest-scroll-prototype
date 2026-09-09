/* ═══════════════════════════════════════════════════════════════════════
   The floating prompt  (?v=open only).

   The bar never moves. It is fixed from the first frame at the exact spot
   the stage's own prompt occupies at scroll 0 — that prompt stays in the
   hero's layout as an invisible slot, keeping its space and lending its
   position — so at the top of the page the two coincide and from then on
   the page scrolls out from under a bar that has not budged. Nothing
   appears, nothing disappears, nothing is handed over.

   The one thing that does change is the question inside it: it belongs to
   whichever section you are actually looking at — the one nearest the
   middle of the screen, not merely the first one intersecting, or it
   would change a screen too early.

   The stage carries a data-ask like any other section rather than being a
   fallback. On a tall window its first teaser already peeks in at the
   bottom while you are still on the stage, and as the only intersecting
   section it would win by default — which is why the stage was showing
   the first teaser's question.

   It does bow out at the end. The closing section asks you to call a real
   person, so the bar leaves rather than lie across that invitation, and
   it stays gone through the footer.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  if (document.documentElement.dataset.variant !== 'open') return;

  const dock  = document.querySelector('.dock');
  const hero  = document.querySelector('.prompt');
  const items = [...document.querySelectorAll('[data-ask]')];
  if (!dock || !hero || !items.length) return;

  const input    = dock.querySelector('.dock__input');
  const FALLBACK = items[0].dataset.ask;   // the stage's own question
  const tail     = document.querySelector('.people');   // where it bows out

  dock.hidden = false;
  input.placeholder = FALLBACK;
  dock.dataset.topic = items[0].dataset.topic;

  /* ── 1. Stand where the stage's prompt stands, once ───────────────── */
  const GAP = 24;                     // never closer than this to an edge

  const nav = document.querySelector('.utility');

  function place() {
    const r    = hero.getBoundingClientRect();
    const rest = r.top + scrollY;     // its position in the document
    /* Measured off the bar, not read from --nav-h: a custom property comes
       back as its unresolved clamp() token, which parses to NaN. */
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    /* A hero taller than the window would park the bar off-screen, so the
       resting place is kept inside the viewport either way. */
    const low  = innerHeight - r.height - GAP;
    document.documentElement.style.setProperty(
      '--dock-top', Math.round(Math.max(navH + GAP, Math.min(rest, low))) + 'px');
  }

  place();
  addEventListener('resize', place);

  /* ── 2. Carry the nearest teaser's question ──────────────────────── */
  const FADE = 220;                   // must match .dock__input's transition
  let shown = FALLBACK;
  let timer = null;

  /* Takes the section, not just its text: the bar also has to publish
     WHICH section it is currently offering, because AI mode answers the
     question the bar is showing. Two places measuring that separately is
     two places to disagree — the question said one thing and the answer
     came back about another. */
  function swap(el) {
    const text = el ? el.dataset.ask : FALLBACK;
    if (text === shown) return;
    shown = text;
    dock.classList.add('is-swapping');
    clearTimeout(timer);              // a fast scroll must not stack fades
    timer = setTimeout(() => {
      input.placeholder = shown;
      dock.dataset.topic = el ? el.dataset.topic : items[0].dataset.topic;
      dock.classList.remove('is-swapping');
      dispatchEvent(new CustomEvent('section', { detail: { topic: dock.dataset.topic } }));
    }, FADE);
  }

  function pick() {
    /* Gone as soon as the closing section reaches the bar's own line —
       not merely when it enters the screen, which would drop the bar
       while the last teaser still has the floor. */
    const gone = tail &&
      tail.getBoundingClientRect().top <= dock.getBoundingClientRect().bottom + GAP;
    dock.classList.toggle('is-gone', !!gone);
    /* Let it leave with the last question it was asked, rather than
       swapping to the fallback behind its own fade. */
    if (gone) return;

    const mid = innerHeight / 2;
    let best = null, bestDist = Infinity;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= innerHeight) continue;   // off screen
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (dist < bestDist) { bestDist = dist; best = el; }
    }
    swap(best);
  }

  /* One read per frame at most: pick() measures every teaser. */
  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; pick(); });
  }, { passive: true });
  addEventListener('resize', pick);
  pick();
})();
