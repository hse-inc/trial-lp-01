(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const column = document.querySelector('.column');
  const slider = document.getElementById('slider');
  const pages = [...slider.querySelectorAll('.page')];
  const css = getComputedStyle(document.documentElement);
  const BRAND = css.getPropertyValue('--color-brand').trim();
  const ACCENT = css.getPropertyValue('--color-accent').trim();
  const PAPER = css.getPropertyValue('--color-paper').trim();

  pages.forEach((pg) => {
    pg.querySelectorAll('.ln, .checks li').forEach((el, i) => el.style.setProperty('--i', i));
  });

  // ---- めくれ上がる文字ブロック（行の長さに沿った輪郭＋下に残るグラデーション面） ----
  const NS = 'http://www.w3.org/2000/svg';
  const PEEL = '.intro__text .grp:not(.intro__both), .intro__close, .fit__hit, .fit__voices, .work__lead, .work__close';
  const peels = [...document.querySelectorAll(PEEL)];
  peels.forEach((g, k) => {
    g.classList.add('peel');
    g.style.setProperty('--dir', k % 2 ? 1 : -1);
    g.style.setProperty('--k', k % 4);
    const top = document.createElement('span');
    top.className = 'peel__top';
    while (g.firstChild) top.appendChild(g.firstChild);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'peel__shape');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'none');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);
    top.prepend(svg);
    const under = document.createElement('span');
    under.className = 'peel__under';
    under.setAttribute('aria-hidden', 'true');
    g.append(under, top);
  });
  // ---- 次のページへ誘う仕掛け（1P：締めの一文から配線が伸びて次ページの札につながる） ----
  const cueHost = document.querySelector('#p1 .page__inner');
  if (cueHost) {
    const cue = document.createElement('a');
    cue.className = 'nextcue';
    cue.href = '#p2';
    cue.dataset.t = '';
    cue.setAttribute('aria-label', '次のページへ進む');
    cue.innerHTML = '<svg class="nextcue__wire" viewBox="0 0 64 46" aria-hidden="true"><path class="nextcue__line" d="M14 0V32H56"/><path class="nextcue__pulse" pathLength="1" d="M14 0V32H56"/></svg>'
      + '<span class="nextcue__chip" aria-hidden="true"><svg class="nextcue__box" viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13"/><path pathLength="1" d="M4 8.2 7 11l5.2-6.2"/></svg>'
      + '<span class="nextcue__next">NEXT</span><b>02 CHECK</b><i></i></span>';
    cueHost.appendChild(cue);
    cue.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('p2').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const shapePeels = () => {
    peels.forEach((g) => {
      const top = g.querySelector('.peel__top');
      const lines = [...top.querySelectorAll('.ln')];
      const W = top.offsetWidth, H = top.offsetHeight;
      const pad = parseFloat(getComputedStyle(top).paddingRight);
      let d = 'M0 0';
      lines.forEach((ln, i) => {
        const right = Math.min(W, Math.round(ln.offsetLeft + ln.offsetWidth + pad));
        const bottom = i === lines.length - 1 ? H : lines[i + 1].offsetTop;
        d += ` H${right} V${bottom}`;
      });
      d += ' H0 Z';
      const svg = top.querySelector('.peel__shape');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.firstChild.setAttribute('d', d);
      g.querySelector('.peel__under').style.clipPath = `path("${d}")`;
    });
  };
  shapePeels();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(shapePeels);
  window.addEventListener('resize', shapePeels);

  // 画面の飾り（読み上げ対象外）
  const add = (html) => { const t = document.createElement('template'); t.innerHTML = html; const el = t.content.firstElementChild; column.appendChild(el); return el; };
  const scan = add('<div class="scan" aria-hidden="true"></div>');
  const reticle = add('<div class="reticle" aria-hidden="true"><i></i><i></i><i></i><i></i><b><span></span></b></div>');
  const rec = add('<p class="hud hud--rec" aria-hidden="true"></p>');
  const pos = add('<p class="hud hud--pos" aria-hidden="true"></p>');
  const corners = [...reticle.querySelectorAll('i')];
  const tag = reticle.querySelector('b');
  const tagText = tag.querySelector('span');

  // ---- 文字の解読 ----
  const GLYPH = 'アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロ０１２３４５６７８９';
  const KEEP = /[\s、。！？・「」＝…]/;
  let active = null;
  const decode = (page) => {
    if (reduce) return;
    const nodes = [];
    page.querySelectorAll('.ln__i, [data-dec]').forEach((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) if (!nodes.includes(w.currentNode)) nodes.push(w.currentNode);
    });
    nodes.forEach((node, k) => {
      if (node.__src == null) node.__src = node.nodeValue;
      const src = node.__src;
      const start = performance.now() + k * 80 + 260;
      const dur = Math.min(760, 240 + src.length * 30);
      const step = (now) => {
        if (page !== active) { node.nodeValue = src; return; }
        const q = (now - start) / dur;
        if (q >= 1) { node.nodeValue = src; return; }
        if (q >= 0) {
          const keep = Math.floor(src.length * q);
          let out = src.slice(0, keep);
          for (let i = keep; i < src.length; i++) out += KEEP.test(src[i]) ? src[i] : GLYPH[(Math.random() * GLYPH.length) | 0];
          node.nodeValue = out;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  // ---- 照準 ----
  let tour = null, tIndex = 0, lockStr = '';
  const lockOn = (el, n) => {
    const c = column.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = r.left - c.left - 6, y = r.top - c.top - 5, w = r.width + 12, h = r.height + 10;
    const pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
    corners.forEach((el2, i) => { el2.style.transform = `translate(${pts[i][0]}px, ${pts[i][1]}px)`; });
    tag.style.transform = `translate(${x}px, ${Math.max(0, y - 20)}px)`;
    lockStr = `LOCK ${String(n).padStart(2, '0')}  X${String(Math.round(x + w / 2)).padStart(3, '0')} Y${String(Math.round(y + h / 2)).padStart(3, '0')}`;
  };
  const startTour = (page) => {
    clearInterval(tour);
    const targets = [...page.querySelectorAll('[data-t]')];
    if (!targets.length) return;
    tIndex = 0;
    const next = () => { lockOn(targets[tIndex % targets.length], (tIndex % targets.length) + 1); tIndex++; };
    setTimeout(next, 350);
    if (!reduce) tour = setInterval(next, 1700);
  };
  document.querySelectorAll('.check').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearInterval(tour);
      const all = [...btn.closest('.page').querySelectorAll('[data-t]')];
      lockOn(btn, all.indexOf(btn) + 1);
    });
  });

  // ---- 3P：仕事の流れ（タップで組み上がる見取り図） ----
  let planStart = () => {}, planStop = () => {};
  const plan = document.querySelector('.plan');
  if (plan) {
    const groups = [1, 2, 3, 4, 5, 6].map((n) => [...plan.querySelectorAll('.s' + n)]);
    const labels = [...plan.querySelectorAll('.plan__step')];
    const btns = [...plan.querySelectorAll('.plan__btn')];
    let step = 0, timer = null, auto = true;
    const setStep = (n) => {
      step = n;
      groups.forEach((gs, i) => gs.forEach((g) => { g.classList.toggle('on', i < n); g.classList.toggle('now', i === n - 1); }));
      labels.forEach((el, i) => el.classList.toggle('is-now', i === n - 1));
      btns.forEach((b, i) => {
        b.classList.toggle('is-now', i === n - 1);
        b.classList.toggle('is-done', i < n - 1);
        b.setAttribute('aria-pressed', String(i === n - 1));
      });
    };
    const play = () => {
      clearTimeout(timer);
      if (!auto || reduce) return;
      timer = setTimeout(() => { setStep(step >= 6 ? 1 : step + 1); play(); }, step >= 6 ? 3800 : 2200);
    };
    const manual = (n) => { auto = false; clearTimeout(timer); setStep(n); };
    btns.forEach((b, i) => b.addEventListener('click', () => manual(i + 1)));
    plan.querySelector('.plan__stage').addEventListener('click', () => manual(step >= 6 ? 1 : step + 1));
    planStart = () => { auto = true; setStep(reduce ? 6 : 1); play(); };
    planStop = () => clearTimeout(timer);
  }

  // ---- ページ切替 ----
  const onActive = (page) => {
    if (page === active) return;
    active = page;
    column.dataset.page = page.id;
    if (!reduce && page.id !== 'top') {
      scan.classList.remove('is-run'); void scan.offsetWidth; scan.classList.add('is-run');
      page.classList.add('is-jit'); setTimeout(() => page.classList.remove('is-jit'), 340);
    }
    decode(page);
    startTour(page);
    if (page.id === 'p3') planStart(); else planStop();
  };
  const mo = new MutationObserver(() => { const p = pages.find((x) => x.classList.contains('is-active')); if (p) onActive(p); });
  pages.forEach((p) => mo.observe(p, { attributes: true, attributeFilter: ['class'] }));
  onActive(pages.find((x) => x.classList.contains('is-active')) || pages[0]);
  window.addEventListener('resize', () => active && startTour(active));

  // ---- 録画表示 ----
  const t0 = performance.now();
  const two = (n) => String(n).padStart(2, '0');
  setInterval(() => {
    const s = (performance.now() - t0) / 1000;
    rec.textContent = `REC ${two(Math.floor(s / 60))}:${two(Math.floor(s % 60))}:${two(Math.floor((s % 1) * 30))}  ${lockStr}`;
  }, 66);

  // ---- 背景：配線が走る ----
  if (reduce) return;
  const cv = document.querySelector('.fx');
  const ctx = cv.getContext('2d');
  const G = 24;
  let W = 0, H = 0;
  const size = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  window.addEventListener('resize', size);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const spawn = () => {
    const d = DIRS[(Math.random() * 4) | 0];
    return { x: Math.round((Math.random() * W) / G) * G, y: Math.round((Math.random() * H) / G) * G, dx: d[0], dy: d[1], run: 0, life: 6 + ((Math.random() * 14) | 0) };
  };
  const wires = Array.from({ length: 16 }, spawn);
  const frame = () => {
    if (!document.hidden) {
      const dark = column.dataset.tone === 'dark';
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      wires.forEach((w, i) => {
        const nx = w.x + w.dx * 2, ny = w.y + w.dy * 2;
        ctx.globalAlpha = dark ? 0.34 : 0.22;
        ctx.strokeStyle = dark ? PAPER : BRAND;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(nx, ny); ctx.stroke();
        w.x = nx; w.y = ny; w.run += 2;
        if (w.run >= G) {
          w.run = 0; w.life--;
          if (Math.random() < 0.4) { const t = w.dx; w.dx = w.dy * (Math.random() < 0.5 ? 1 : -1); w.dy = t * (Math.random() < 0.5 ? 1 : -1); }
          if (w.life <= 0 || w.x < 0 || w.y < 0 || w.x > W || w.y > H) {
            ctx.globalAlpha = dark ? 0.8 : 0.6;
            ctx.fillStyle = dark ? ACCENT : BRAND; ctx.fillRect(w.x - 2, w.y - 2, 4, 4);
            wires[i] = spawn();
          }
        }
      });
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
