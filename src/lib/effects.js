// Scroll-reveal, count-up numbers and 3D card tilt — framework-agnostic helpers used from React effects.

let io;
export function observeReveals() {
  io?.disconnect();
  io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); countUp(e.target); io.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  document.querySelectorAll('.reveal:not(.in),.steps:not(.in)').forEach((el) => io.observe(el));
}

function countUp(root) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), D = 1600;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e).toLocaleString() + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function bindTilt() {
  if (window.__tilt || matchMedia('(hover: none)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.__tilt = 1;
  let cur = null;
  const reset = (el) => { el.style.transition = 'transform .7s cubic-bezier(.2,.7,.2,1), box-shadow .35s, border-color .35s'; el.style.transform = ''; };
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest('.card,.area,.track,.offer,.value,.rung');
    if (cur && cur !== el) { reset(cur); cur = null; }
    if (!el) return;
    cur = el;
    if (!el.classList.contains('tilt')) {
      el.classList.add('tilt');
      const s = document.createElement('span'); s.className = 'tilt-shine'; el.appendChild(s);
    }
    const b = el.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    el.style.animation = 'none';
    el.style.transition = 'transform .12s ease-out, box-shadow .35s, border-color .35s';
    el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 10).toFixed(2)}deg) rotateY(${((px - 0.5) * 12).toFixed(2)}deg) translateY(-6px) scale(1.015)`;
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  }, { passive: true });
}
