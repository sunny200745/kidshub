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
    // Validation helper
    const validateEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const showError = (input, message) => {
      input.classList.add('input-error');
      let errorEl = input.parentElement.querySelector('.error-message');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        input.parentElement.appendChild(errorEl);
      }
      errorEl.textContent = message;
    };

    const clearError = (input) => {
      input.classList.remove('input-error');
      const errorEl = input.parentElement.querySelector('.error-message');
      if (errorEl) errorEl.remove();
    };

    // Clear errors on input
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => clearError(input));
      input.addEventListener('change', () => clearError(input));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Clear all previous errors
      form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
      form.querySelectorAll('.error-message').forEach(el => el.remove());

      // Validate required fields
      const name = form.querySelector('#form-name');
      const email = form.querySelector('#form-email');
      const centre = form.querySelector('#form-centre');
      const phone = form.querySelector('#form-phone');
      
      let isValid = true;

      if (!name.value.trim()) {
        showError(name, 'Please enter your name');
        isValid = false;
      }

      if (!email.value.trim()) {
        showError(email, 'Please enter your email');
        isValid = false;
      } else if (!validateEmail(email.value.trim())) {
        showError(email, 'Please enter a valid email address');
        isValid = false;
      }

      if (!centre.value.trim()) {
        showError(centre, 'Please enter your centre name');
        isValid = false;
      }

      if (!phone.value.trim()) {
        showError(phone, 'Please enter your phone number');
        isValid = false;
      }

      if (!isValid) {
        // Focus on first invalid field
        const firstError = form.querySelector('.input-error');
        if (firstError) firstError.focus();
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-spinner"></span> Sending...';

      const formData = new FormData(form);

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const formFields = form.querySelector('.form-fields');
          const successMsg = form.querySelector('.form-success');
          if (formFields) formFields.style.display = 'none';
          if (successMsg) successMsg.classList.add('show');
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        console.error('Form error:', error);
        alert('Something went wrong. Please try again or email us directly at contact@nuvaro.ca');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
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
