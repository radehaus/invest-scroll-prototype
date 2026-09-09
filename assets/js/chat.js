/* ═══════════════════════════════════════════════════════════════════════
   AI mode  (?v=open only).

   The handover, not the chatbot. What has to be convincing is the moment
   between the two screens: you type your own question anywhere on the
   page, and the next thing you see is that question, in your words, being
   answered under the nav item that promised it. Whether a real model
   wrote the answer tests something else entirely, and a static host
   cannot hold an API key anyway.

   So the answers are written, one per section. A question typed freehand
   is matched to the section it sounds most like — a canned reply that is
   at least about the right product reads far better than a generic one,
   and when nothing matches it says so and offers a person.

   The thread is kept. Ask about the guarantee, go back and read on, then
   return with a question about school fees — and the first exchange is
   still above the second. It is one conversation with one counterpart:
   finding your own question gone would read as having been forgotten,
   and a thread accumulating across products is the argument this page is
   making in the first place. It survives a reload in sessionStorage,
   which is per tab, exactly like the gate. "Start over" is the way out.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  if (document.documentElement.dataset.variant !== 'open') return;

  const view     = document.getElementById('ai-mode');
  const log      = document.getElementById('chat-log');
  const composer = document.getElementById('chat-composer');
  const input    = document.getElementById('chat-input');
  const newBtn   = document.getElementById('chat-new');
  const dock     = document.querySelector('.dock');
  const navLink  = document.querySelector('[data-ai-mode]');
  if (!view || !log || !composer || !dock) return;

  /* ── The written answers ──────────────────────────────────────────────
     Prototype copy. Every figure here is illustrative and none of it has
     been through product or compliance.                               */
  const ANSWERS = {
    start:
      "At 40 you still have around 25 years of compounding in front of you, and that " +
      "is the part doing most of the work — not picking the right fund. Most people " +
      "starting now settle two things first: a monthly amount they genuinely will not " +
      "miss, and how much of it has to be guaranteed. If you want the state to carry " +
      "part of the cost, a subsidised pension is usually the first slot to fill. " +
      "Anything above that belongs in the markets. Shall I sketch what a plan looks " +
      "like starting at 40 with €250 a month?",
    guarantee:
      "Allianz Invest Guarantee splits the job in two. A guaranteed component holds " +
      "the floor you never want to fall through; everything above it takes part in " +
      "market returns. You choose where that line sits when you start, and you can " +
      "move it later. The trade is honest and it is the only real decision here: the " +
      "higher the guarantee, the smaller the share that can grow. Want to see how an " +
      "80% guarantee compares with a 60% one over twenty years?",
    wealth:
      "Allianz Global Investors — the same people who run institutional mandates, " +
      "running those strategies at a size that fits you. You choose a portfolio " +
      "according to how much movement you can live with; from there it is monitored " +
      "and rebalanced for you. There is no lock-up, and you can switch or leave at " +
      "any point. Shall I walk you through the four portfolios?",
    retirement:
      "It depends on your income, whether you are married, and how many children you " +
      "have. The support arrives two ways — a direct allowance for you and for each " +
      "child, and tax relief — and the tax office automatically gives you whichever " +
      "is worth more, so you never have to choose. Families with children are usually " +
      "carried by the allowances; higher earners without children by the tax side. " +
      "Tell me roughly what you earn and how many children, and I can put a number on it.",
    protect:
      "The useful starting point is what would still have to be paid if your income " +
      "stopped: the mortgage, and the years until the youngest is standing on their " +
      "own. The common rule of thumb is three to five annual incomes plus whatever is " +
      "left on the loan — worth treating as a first sketch, not an answer. Term cover " +
      "is priced per year of protection, so buying only the years you actually need is " +
      "what keeps it cheap. How old are your children?",
    kids:
      "Earlier matters more than bigger. €50 a month from birth is €10,800 of your own " +
      "money by the time they turn eighteen; start at nine and it is half that, and it " +
      "has had half as long to grow. Small and early beating large and late is about " +
      "the only thing nobody in investing argues about. You stay flexible throughout, " +
      "and control passes to them at 18. Want to see what €50 a month could look like " +
      "at eighteen?",
  };

  const NO_MATCH =
    "That one I would rather not guess at — it depends on details I do not have yet. " +
    "A named advisor can go through it with you properly, and they will already know " +
    "what you have told me here. Shall I arrange a call back?";

  /* ── Which section does a freehand question sound like? ───────────── */
  const STOP = new Set(('a an and are as at be by can do does for from get have how i ' +
    'if in is it me my of on or should so that the to want what when where which ' +
    'who why will with would you your').split(' '));

  const words = t => (t.toLowerCase().match(/[a-zäöüß]+/g) || []).filter(w => w.length > 2 && !STOP.has(w));

  /* A section describes itself through its own heading, question and copy,
     which needs no upkeep — but prose only contains the words the writer
     happened to use. Nobody types "children" when they mean their
     daughter. So each topic also names the handful of words that identify
     it outright, and those count double: one of them is enough. */
  const STRONG = {
    start:      'start starting begin beginning first plan advice newcomer',
    guarantee:  'guarantee guaranteed safe safety secure floor downside crash risk risking losing',
    wealth:     'portfolio portfolios managed manager managing management strategy strategies institutional allocation',
    retirement: 'pension pensions retire retiring retirement subsidy subsidised subsidized riester allowance tax',
    protect:    'cover coverage insure insurance protect protecting term death dependants dependents mortgage widow',
    kids:       'kid kids child children daughter son grandchild grandchildren baby birth school university',
  };

  const SECTION = '[data-ask][data-topic]';   // not the nav links, which
                                              // carry a topic and no ask
  const topics = [...document.querySelectorAll(SECTION)].map(el => ({
    topic: el.dataset.topic,
    terms: new Set(words([el.dataset.ask, el.textContent].join(' '))),
    strong: new Set(STRONG[el.dataset.topic].split(' ')),
  }));

  function classify(question) {
    const asked = words(question);
    if (!asked.length) return null;
    let best = null, bestScore = 0;
    for (const t of topics) {
      const score = asked.reduce((n, w) =>
        n + (t.strong.has(w) ? 2 : t.terms.has(w) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; best = t.topic; }
    }
    /* One incidental word of prose in common is a coincidence, not a
       subject — but one word that names the topic outright is not. */
    return bestScore >= 2 ? best : null;
  }

  /* ── Rendering ───────────────────────────────────────────────────── */
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bubble(kind, text) {
    const el = document.createElement('div');
    el.className = 'msg msg--' + kind;
    el.textContent = text || '';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  /* ── Keeping the thread ──────────────────────────────────────────── */
  const KEY = 'ai-thread';
  let thread = [];
  try { thread = JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) { thread = []; }

  const save = () => {
    try { sessionStorage.setItem(KEY, JSON.stringify(thread)); } catch (e) {}
    if (newBtn) newBtn.hidden = !thread.length;
  };

  function restore() {
    log.replaceChildren();
    for (const m of thread) bubble(m.who, m.text);
    /* You come back to where you left off, which is the bottom — but only
       once it has been laid out and there is a bottom to go to. */
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
    if (newBtn) newBtn.hidden = !thread.length;
  }

  if (newBtn) newBtn.addEventListener('click', () => {
    thread = [];
    save();
    log.replaceChildren();
    input.focus();
  });

  function type(el, text) {
    if (still) { el.textContent = text; return; }
    const parts = text.split(' ');
    let i = 0;
    (function next() {
      el.textContent = parts.slice(0, ++i).join(' ');
      log.scrollTop = log.scrollHeight;
      if (i < parts.length) {
        /* A beat at the end of a sentence, so it reads as speech. */
        setTimeout(next, /[.?!]$/.test(parts[i - 1]) ? 220 : 26);
      }
    })();
  }

  /* A question lifted straight from a section arrives with its topic
     already known; only freehand text has to be guessed at. */
  function answer(question, topic) {
    const t    = topic || classify(question);
    const text = t ? ANSWERS[t] : NO_MATCH;
    thread.push({ who: 'ai', text }); save();
    const el    = bubble('ai');
    el.classList.add('is-thinking');
    el.innerHTML = '<i></i><i></i><i></i>';
    setTimeout(() => {
      el.classList.remove('is-thinking');
      el.textContent = '';
      type(el, text);
    }, still ? 0 : 620);
  }

  function ask(question, topic) {
    thread.push({ who: 'me', text: question }); save();
    bubble('me', question);
    answer(question, topic);
  }

  /* ── Switching views ─────────────────────────────────────────────── */
  /* The masthead is not sticky, so the chat may only claim the height left
     under it — otherwise the view is one masthead too tall and the whole
     page scrolls behind a screen that is meant to be fixed. */
  const masthead = document.querySelector('.masthead');
  const measure = () => document.documentElement.style.setProperty(
    '--masthead-h', (masthead ? masthead.offsetHeight : 0) + 'px');
  measure();
  addEventListener('resize', measure);

  function show(push) {
    document.documentElement.dataset.view = 'chat';
    dispatchEvent(new CustomEvent('view', { detail: { view: 'chat' } }));
    if (push) {
      const u = new URL(location.href);
      u.searchParams.set('v', 'open');
      u.searchParams.set('ai', '1');
      history.pushState({ ai: 1 }, '', u);
    }
    scrollTo({ top: 0, behavior: 'instant' });
    input.focus();
  }

  function hide() {
    delete document.documentElement.dataset.view;
    dispatchEvent(new CustomEvent('view',
      { detail: { view: 'page', topic: dock.dataset.topic || 'start' } }));
  }

  /* Any nav link is also a way out of here. */
  addEventListener('leave-chat', () => {
    if (document.documentElement.dataset.view !== 'chat') return;
    hide();
    const u = new URL(location.href);
    u.searchParams.delete('ai');
    history.pushState({}, '', u);
  });

  /* ── Wiring ──────────────────────────────────────────────────────── */
  /* The question the bar is showing is the one the user is looking at, so
     an empty submit sends that rather than nothing — the placeholder is a
     real offer, not decoration. */
  const dockInput = dock.querySelector('.dock__input');

  dock.addEventListener('submit', e => {
    e.preventDefault();
    const typed = dockInput.value.trim();
    const q = typed || dockInput.placeholder || '';
    if (!q) return;
    dockInput.value = '';
    show(true);
    /* Whatever the bar is offering, it also says which section it belongs
       to — so an untouched question can never be answered as another. */
    ask(q, typed ? null : dock.dataset.topic);
  });

  composer.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q, null);
  });

  if (navLink) navLink.addEventListener('click', e => {
    e.preventDefault();
    const t = dock.dataset.topic || 'start';
    show(true);
    if (!thread.length) ask(askOf(t), t);
  });

  const askOf = t => document.querySelector('[data-ask][data-topic="' + t + '"]').dataset.ask;

  addEventListener('popstate', () => {
    new URLSearchParams(location.search).get('ai') ? show(false) : hide();
  });

  restore();

  /* Deep link: ?v=open&ai=1 opens straight into the conversation — into
     the one already going, if there is one. */
  if (new URLSearchParams(location.search).get('ai')) {
    show(false);
    if (!thread.length) ask(askOf('start'), 'start');
  }
})();
