// ============================================================
// KidsHub Landing — Main JavaScript
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── NAVBAR SCROLL ──────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── MOBILE MENU ────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
    });
  });

  // ── ACTIVE NAV LINK ────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a[data-section]');

  const markActive = () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) a.classList.add('active');
    });
  };
  window.addEventListener('scroll', markActive, { passive: true });

  // ── SCROLL REVEAL ──────────────────────────────────────────
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── DEMO FORM ──────────────────────────────────────────────
  const form = document.getElementById('demo-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-spinner"></span> Sending...';

      const data = {
        name:     form.name.value,
        email:    form.email.value,
        centre:   form.centre.value,
        phone:    form.phone.value,
        size:     form.size.value,
        message:  form.message.value,
      };

      // Simulate send (replace with Resend/EmailJS/Formspree endpoint)
      await new Promise(r => setTimeout(r, 1200));

      const formFields = form.querySelector('.form-fields');
      const successMsg = form.querySelector('.form-success');
      if (formFields) formFields.style.display = 'none';
      if (successMsg) successMsg.classList.add('show');

      // Optional: integrate EmailJS or Resend here
      // emailjs.send('service_id', 'template_id', data);
    });
  }

  // ── SMOOTH ANCHOR SCROLLING ────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
