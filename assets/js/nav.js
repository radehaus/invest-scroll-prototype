/* ═══════════════════════════════════════════════════════════════════════
   The utility nav.

   Two jobs, and the second one is the reason this is a file of its own.

   Going somewhere. Every link points at a real section, and the two
   versions get there differently: with every teaser open it is an
   ordinary anchor, but in the accordion a section has no place on the
   page to scroll to — it lives at a position along a pinned track. That
   sum is already written, in accordion.js, behind the click handler on
   each row. So the accordion's nav clicks that row rather than working it
   out a second time somewhere else.

   Saying where you are. Exactly one item is underlined, and which one is
   not this file's decision — whoever already knows announces it as a
   `section` event: dock.js when every teaser is open, accordion.js when
   the spring settles on one. Measuring it here as well would be a third
   opinion on a question that has one answer.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  const nav = document.querySelector('.utility__nav');
  if (!nav) return;

  const open  = document.documentElement.dataset.variant === 'open';
  const links = [...nav.querySelectorAll('[data-topic]')];
  const aiLink = nav.querySelector('[data-ai-mode]');

  /* ── Where you are ────────────────────────────────────────────────── */
  function mark(topic) {
    for (const a of links) a.classList.toggle('is-active', a.dataset.topic === topic);
    if (aiLink) aiLink.classList.toggle('is-active', topic === 'ai');
  }

  addEventListener('section', e => {
    /* AI mode holds the underline while it is on screen — the sections
       behind it are hidden, so anything they report is stale. */
    if (document.documentElement.dataset.view === 'chat') return;
    mark(e.detail.topic);
  });
  addEventListener('view', e => mark(e.detail.view === 'chat' ? 'ai' : e.detail.topic));

  /* A deep link into AI mode switches the view while this file is still
     being parsed, so the opening announcement is made to nobody. Read the
     state once rather than rely on having been listening. */
  if (document.documentElement.dataset.view === 'chat') mark('ai');

  /* ── Getting there ───────────────────────────────────────────────── */
  const leaveChat = () => dispatchEvent(new CustomEvent('leave-chat'));

  for (const a of links) {
    a.addEventListener('click', e => {
      e.preventDefault();
      leaveChat();
      const target = document.getElementById(a.dataset.topic);
      if (!target) {                                  // "Allianz Invest"
        scrollTo({ top: 0, behavior: 'smooth' });
        mark('start');
        return;
      }
      if (open) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        /* The accordion already knows what this position is worth. */
        target.querySelector('.acc__title').click();
      }
      mark(a.dataset.topic);
    });
  }
})();
