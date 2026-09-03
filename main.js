/* =========================================================
   MAIN.JS — nav behaviour, scroll reveals, footer year,
   the 2D ayurveda "petal dust" canvas, and the contact form.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: solid background on scroll ---------- */
  const nav = document.getElementById('siteNav');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- Scroll-reveal ---------- */
  const revealTargets = document.querySelectorAll(
    '.about-copy, .about-figure, .service-card, .product-card, .approach-quote, .approach-step, .visit-card, .visit-hours, .contact-panel, .contact-form'
  );
  revealTargets.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = reduceMotion ? '0s' : `${(i % 6) * 0.06}s`;
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Contact form (static template) ---------- */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formNote.textContent = 'Thanks — this is a template confirmation. Connect the form to email or a backend to receive real requests.';
      formNote.style.color = 'var(--turmeric)';
      form.reset();
    });
  }

  /* ---------- Ayurveda section: floating petal/dust canvas (2D) ---------- */
  const petalCanvas = document.getElementById('petalCanvas');
  if (petalCanvas && !reduceMotion) {
    const ctx = petalCanvas.getContext('2d');
    const section = petalCanvas.parentElement;
    let particles = [];
    let w, h;

    function resize() {
      w = petalCanvas.width = section.clientWidth;
      h = petalCanvas.height = section.clientHeight;
      const count = Math.round((w * h) / 26000);
      particles = Array.from({ length: count }, () => spawnParticle(true));
    }

    function spawnParticle(randomY) {
      const palette = ['rgba(217,164,65,0.55)', 'rgba(124,143,99,0.5)', 'rgba(243,236,221,0.35)'];
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + 10,
        r: 1.2 + Math.random() * 2.4,
        speed: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 0.4,
        color: palette[Math.floor(Math.random() * palette.length)]
      };
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) Object.assign(p, spawnParticle(false));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    tick();
  }
});
