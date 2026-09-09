/* ═══════════════════════════════════════════════════════════════════════
   The two figures on the Guarantee page.

   Both are drawn rather than pictured, because both are the answer to a
   sum the page has already stated in words, and a picture of one number
   is a picture that goes stale. The controls are live for the same
   reason: they cost nothing once the drawing exists, and a slider that
   does not move reads as broken.

   The model, in full — it is small, and it is the whole basis of both:

     To guarantee G of your deposits on a date T years out, the security
     component has to hold whatever grows to G by then at its own rate s.
     So its share today is  G / (1 + s)^T,  and the rest is free to go
     into the market. A longer horizon needs less set aside, which is why
     the ring opens up as you push the date out.

   Every rate here is illustrative. None of it has been past product or
   compliance, and it is not a forecast.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  const SECURITY   = 0.045;                       // security component, p.a.
  const SCENARIOS  = [                            // return component, p.a.
    { key: 'good', rate: 0.100, color: '#5FCD8A', label: 'Good' },
    { key: 'avg',  rate: 0.045, color: '#007AB3', label: 'Average' },
    { key: 'bad',  rate: 0.015, color: '#A6276F', label: 'Bad' },
  ];
  const DEPOSITS_COLOR = '#0E9B93';

  const euro = n => Math.round(n).toLocaleString('de-DE');
  const securityShare = (guarantee, years) =>
    Math.min(1, guarantee / Math.pow(1 + SECURITY, years));

  /* Future value of a lump sum plus a monthly stream, compounded yearly. */
  const value = (first, monthly, rate, years) => {
    const g = Math.pow(1 + rate, years);
    return first * g + (rate === 0 ? monthly * 12 * years
                                   : monthly * 12 * (g - 1) / rate);
  };

  /* ── The ring ────────────────────────────────────────────────────── */
  const seg   = document.querySelector('.seg');
  const years = document.getElementById('years');

  if (seg && years) {
    const sec = document.querySelector('.ring__sec');
    const ret = document.querySelector('.ring__ret');
    const secPct = document.getElementById('sec-pct');
    const retPct = document.getElementById('ret-pct');
    const out = document.getElementById('years-out');

    function drawRing() {
      const level = +seg.querySelector('.is-on').dataset.level / 100;
      const s = securityShare(level, +years.value);
      const pct = Math.round(s * 100);
      /* pathLength="100" on both circles, so the dash array is percent. */
      sec.setAttribute('stroke-dasharray', pct + ' ' + (100 - pct));
      ret.setAttribute('stroke-dasharray', (100 - pct) + ' ' + pct);
      ret.setAttribute('stroke-dashoffset', -pct);
      secPct.textContent = pct + '%';
      retPct.textContent = (100 - pct) + '%';
      out.textContent = years.value + (years.value === '1' ? ' year' : ' years');
    }

    seg.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      for (const other of seg.querySelectorAll('button')) {
        const on = other === b;
        other.classList.toggle('is-on', on);
        other.setAttribute('aria-checked', String(on));
      }
      drawRing();
    });
    years.addEventListener('input', drawRing);
    drawRing();
  }

  /* ── The chart ───────────────────────────────────────────────────── */
  const svg = document.getElementById('sim-chart');
  if (!svg) return;

  const f = {
    guarantee: document.getElementById('sim-guarantee'),
    first:     document.getElementById('sim-first'),
    monthly:   document.getElementById('sim-monthly'),
    years:     document.getElementById('sim-years'),
  };
  const outs = {
    first:   document.getElementById('sim-first-out'),
    monthly: document.getElementById('sim-monthly-out'),
    years:   document.getElementById('sim-years-out'),
  };

  const W = 800, H = 400, PAD = { t: 24, r: 96, b: 42, l: 78 };
  const el = (name, attrs) => {
    const n = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  function draw() {
    const first   = +f.first.value;
    const monthly = +f.monthly.value;
    const T       = +f.years.value;
    const share   = securityShare(+f.guarantee.value / 100, T);

    outs.first.textContent   = euro(first);
    outs.monthly.textContent = euro(monthly);
    outs.years.textContent   = T;

    /* One blended rate per scenario: the security part always earns its
       own, the rest earns the scenario's. */
    const series = SCENARIOS.map(s => ({
      ...s,
      rate: share * SECURITY + (1 - share) * s.rate,
    }));

    const steps = 60;
    const points = series.map(s => ({
      ...s,
      pts: Array.from({ length: steps + 1 }, (_, i) => {
        const t = T * i / steps;
        return [t, value(first, monthly, s.rate, t)];
      }),
    }));
    const deposits = Array.from({ length: steps + 1 }, (_, i) => {
      const t = T * i / steps;
      return [t, first + monthly * 12 * t];
    });

    const maxY = Math.max(...points.flatMap(s => s.pts.map(p => p[1])));
    const top  = Math.ceil(maxY / 10000) * 10000 || 10000;
    const x = t => PAD.l + (W - PAD.l - PAD.r) * (t / T);
    const y = v => H - PAD.b - (H - PAD.t - PAD.b) * (v / top);
    const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1)).join(' ');

    svg.replaceChildren();

    /* Grid and value axis — recessive, four lines, labelled. */
    for (let i = 0; i <= 4; i++) {
      const v = top * i / 4;
      svg.append(el('line', { x1: PAD.l, x2: W - PAD.r, y1: y(v), y2: y(v),
        stroke: '#E3E7EB', 'stroke-width': 1, 'stroke-dasharray': '2 4' }));
      const t = el('text', { x: PAD.l - 10, y: y(v) + 4, 'text-anchor': 'end',
        fill: '#5A6472', 'font-size': 12 });
      t.textContent = euro(v) + ' €';
      svg.append(t);
    }

    /* Year axis. */
    const ticks = T <= 10 ? [0, Math.round(T / 2), T]
                          : [0, Math.round(T / 3), Math.round(2 * T / 3), T];
    for (const t of ticks) {
      const lbl = el('text', { x: x(t), y: H - PAD.b + 22, 'text-anchor': 'middle',
        fill: '#5A6472', 'font-size': 12 });
      lbl.textContent = t === 0 ? 'Today' : t;
      svg.append(lbl);
    }
    const unit = el('text', { x: W - PAD.r + 6, y: H - PAD.b + 22,
      fill: '#5A6472', 'font-size': 12 });
    unit.textContent = 'years';
    svg.append(unit);

    /* The average scenario carries a fill, so it reads as the middle. */
    const avg = points.find(p => p.key === 'avg');
    svg.append(el('path', {
      d: path(avg.pts) + ' L' + x(T) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z',
      fill: '#007AB3', 'fill-opacity': .08,
    }));

    svg.append(el('path', { d: path(deposits), fill: 'none', stroke: DEPOSITS_COLOR,
      'stroke-width': 2, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }));

    for (const s of points) {
      svg.append(el('path', { d: path(s.pts), fill: 'none', stroke: s.color,
        'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    }

    /* Direct labels at the end of each line. The green sits under 3:1 on
       white, so its identity may not rest on the colour alone — these
       chips are what carry it. */
    const ends = points.map(s => ({ ...s, v: s.pts[steps][1] }))
                       .sort((a, b) => b.v - a.v);
    let lastY = -Infinity;
    for (const s of ends) {
      let cy = y(s.v);
      if (cy - lastY < 36) cy = lastY + 36;      // never let two chips collide
      lastY = cy;
      const g = el('g', {});
      g.append(el('rect', { x: W - PAD.r + 4, y: cy - 17, width: PAD.r - 8, height: 34,
        rx: 4, fill: s.color }));
      const a = el('text', { x: W - PAD.r + 12, y: cy - 3, fill: '#fff',
        'font-size': 12, 'font-weight': 700 });
      a.textContent = euro(s.v) + ' €';
      const b = el('text', { x: W - PAD.r + 12, y: cy + 12, fill: '#fff', 'font-size': 11 });
      b.textContent = (s.rate * 100).toFixed(1).replace('.', ',') + ' % p.a.';
      g.append(a, b);
      svg.append(g);
    }

    for (const s of points) {
      document.getElementById('lg-' + s.key).textContent = ' · ' + euro(s.pts[steps][1]) + ' €';
    }
    document.getElementById('lg-dep').textContent =
      ' · ' + euro(deposits[steps][1]) + ' €';

    /* The same figures in words, for anyone not reading the picture. */
    document.getElementById('sim-desc').textContent =
      'After ' + T + ' years, deposits of ' + euro(deposits[steps][1]) + ' euro reach ' +
      ends.map(s => s.label.toLowerCase() + ' ' + euro(s.v) + ' euro').join(', ') + '.';
  }

  for (const k in f) f[k].addEventListener('input', draw);
  addEventListener('resize', draw);
  draw();
})();
