/* ═══════════════════════════════════════════════════════════════════════
   The utility nav.

   Three destinations, and all three are pages: the home page, AI mode,
   and the Guarantee detail page. The other four are not built yet and say
   so by not being links at all — a nav that sometimes opens a page and
   sometimes jumps to a scroll position teaches you nothing about where
   you are, and a link that goes nowhere is worse than a plain label.

   Which item is underlined therefore follows the view rather than the
   scroll position. On the home page that is home, unless AI mode is open
   over it.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  const nav = document.querySelector('.utility__nav');
  if (!nav) return;

  const links = [...nav.querySelectorAll('[data-nav]')];
  const here  = document.querySelector('.acc') ? 'home' : 'guarantee';

  const mark = where => {
    for (const a of links) a.classList.toggle('is-active', a.dataset.nav === where);
  };

  /* AI mode opens and closes without a page load, so the mark follows it. */
  addEventListener('view', e => mark(e.detail.view === 'chat' ? 'ai' : here));

  /* A deep link switches the view while this file is still being parsed,
     so the opening announcement is made to nobody. Read the state once
     rather than rely on having been listening. */
  if (document.documentElement.dataset.view === 'chat') mark('ai');

  /* Home is where we already are: leave AI mode rather than reload. */
  for (const a of links) {
    if (a.dataset.nav !== 'home' || here !== 'home') continue;
    a.addEventListener('click', e => {
      e.preventDefault();
      dispatchEvent(new CustomEvent('leave-chat'));
      scrollTo({ top: 0, behavior: 'smooth' });
      mark('home');
    });
  }
})();
