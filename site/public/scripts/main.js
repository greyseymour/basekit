/* =========================================================================
   BaseKit — main.js
   No frameworks. Vanilla, tight, anti-AI.
   ========================================================================= */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Theme toggle (no localStorage — sandboxed iframe safe) -------- */
const themeBtn = document.querySelector('[data-action="toggle-theme"]');
themeBtn?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', next === 'dark' ? '#0A0A0F' : '#FFFFFF');
});

/* ---------- Terminal clock ----------------------------------------------- */
const clock = document.getElementById('clock');
function tickClock() {
  if (!clock) return;
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  clock.textContent = `${hh}:${mm}`;
}
tickClock();
setInterval(tickClock, 30_000);

/* ---------- Hero scramble ------------------------------------------------ */
const SCRAMBLE_POOL = '!@#$%^&*<>?/|{}[]=+-_:;~';
function scrambleEl(el) {
  if (!el) return;
  const target = el.dataset.scramble || el.textContent.trim();
  el.textContent = '';

  const chars = [...target];
  const spans = chars.map((ch) => {
    const s = document.createElement('span');
    s.className = 'scramble-char';
    s.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(s);
    return { el: s, final: ch };
  });

  if (reduceMotion) return;

  // Reveal in waves: each char scrambles ~3-5 times then locks
  const baseDelay = 24; // ms per char
  const duration = 28;  // ms per swap
  const swaps = 4;

  spans.forEach((s, i) => {
    if (s.final === ' ') return;
    let swap = 0;
    s.el.classList.add('scrambling');
    const start = i * baseDelay;
    const tick = () => {
      if (swap < swaps) {
        s.el.textContent = SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
        swap++;
        setTimeout(tick, duration);
      } else {
        s.el.textContent = s.final;
        s.el.classList.remove('scrambling');
      }
    };
    setTimeout(tick, start);
  });
}
document.querySelectorAll('.hero-title [data-scramble]').forEach(scrambleEl);

/* ---------- Background lattice canvas ------------------------------------ */
const canvas = document.getElementById('lattice');
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let dots = [];
  let mx = -9999, my = -9999;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const cell = 56;
    dots = [];
    for (let y = cell / 2; y < h; y += cell) {
      for (let x = cell / 2; x < w; x += cell) {
        dots.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6 });
      }
    }
  }

  function readColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const baseColor = document.documentElement.dataset.theme === 'dark'
      ? 'rgba(255,255,255,0.06)'
      : 'rgba(10,10,15,0.10)';
    const hotColor = readColor('--accent') || '#3D3DFF';

    for (const d of dots) {
      const dx = d.x - mx;
      const dy = d.y - my;
      const dist2 = dx * dx + dy * dy;
      const r = dist2 < 26000 ? 1.6 : 1.0;
      if (dist2 < 26000) {
        const t = 1 - dist2 / 26000;
        ctx.fillStyle = hotColor;
        ctx.globalAlpha = 0.18 + t * 0.55;
      } else {
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  window.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });
  resize();
  draw();
}

/* ---------- Reveal observer --------------------------------------------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.15 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

/* ---------- Audience toggle (Humans ↔ Agents) --------------------------- */
const audienceToggle = document.querySelector('.audience-toggle');
const audienceBtns = document.querySelectorAll('.audience');
const panels = document.querySelectorAll('.install-panel');
audienceBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const which = btn.dataset.audience;
    audienceBtns.forEach((b) => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    audienceToggle.dataset.active = which;
    panels.forEach((p) => {
      const match = p.dataset.panel === which;
      p.classList.toggle('active', match);
      p.hidden = !match;
    });
  });
});

/* ---------- Env tabs ---------------------------------------------------- */
const envBtns = document.querySelectorAll('.env');
const snippets = document.querySelectorAll('.snippet');
envBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const which = btn.dataset.env;
    envBtns.forEach((b) => b.classList.toggle('active', b === btn));
    snippets.forEach((s) => {
      const match = s.dataset.snippet === which;
      s.hidden = !match;
    });
  });
});

/* ---------- Stack toggle (Base MCP / BaseKit / Together) ---------------- */
const stackToggle = document.querySelector('.stack-toggle');
const stackTabs = document.querySelectorAll('.stack-tab');
const stackPanels = document.querySelectorAll('[data-stack-panel]');
stackTabs.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    const which = btn.dataset.stack;
    stackTabs.forEach((b) => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (stackToggle) stackToggle.dataset.active = which;
    stackPanels.forEach((p) => {
      const match = p.dataset.stackPanel === which;
      p.classList.toggle('active', match);
      p.hidden = !match;
    });
  });
});

/* ---------- Copy button ------------------------------------------------- */
const copyBtn = document.querySelector('.copy-btn');
copyBtn?.addEventListener('click', async () => {
  const visible = [...snippets].find((s) => !s.hidden);
  if (!visible) return;
  const text = visible.textContent.trim();
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add('copied');
    copyBtn.querySelector('.copy-label').textContent = 'Copied';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.querySelector('.copy-label').textContent = 'Copy';
    }, 1600);
  } catch (err) {
    /* clipboard blocked — fail silently */
  }
});

/* ---------- Rotator strip ------------------------------------------------ */
const rots = document.querySelectorAll('[data-rotator] .rot');
if (rots.length && !reduceMotion) {
  let i = 0;
  setInterval(() => {
    rots[i].classList.remove('active');
    i = (i + 1) % rots.length;
    rots[i].classList.add('active');
  }, 3400);
}

/* ---------- Konami / "gm" easter egg ------------------------------------ */
const konami = document.getElementById('konami');
let buf = '';
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    konami.hidden = true;
    return;
  }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  buf = (buf + e.key.toLowerCase()).slice(-8);
  if (buf.endsWith('gm')) {
    konami.hidden = false;
  }
});
konami?.addEventListener('click', () => { konami.hidden = true; });

/* ---------- Smooth scroll for in-page anchors --------------------------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
