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


  // ── GSAP TIMELINE ANIMATIONS FOR SVG SHOWCASES ──────────────────
  // Animations run continuously on loop

  // ── DASHBOARD SVG ANIMATION (Continuous Loop) ──
  const animateDashboard = () => {
    if (!document.getElementById('dashboardSVG')) return;
    
    // Main timeline that loops
    const tl = gsap.timeline({ 
      defaults: { ease: "power2.out" },
      repeat: -1,
      repeatDelay: 0.5
    });
    
    // Initial states
    tl.set("#dash-tablet", { opacity: 0, y: 60, scale: 0.9 })
      .set("#dash-sidebar", { opacity: 0, x: -40 })
      .set("#dash-header", { scaleX: 0, transformOrigin: "left" })
      .set("#dash-card-activity, #dash-card-overview", { opacity: 0, y: 30 })
      .set("#dash-ratios", { opacity: 0, y: 40 })
      .set("#dash-bar1, #dash-bar2, #dash-bar3, #dash-bar4", { scaleY: 0, transformOrigin: "bottom" })
      .set("#dash-pie-float", { opacity: 0, scale: 0, rotation: -180 })
      .set("#dash-donut-float", { opacity: 0, scale: 0 })
      .set("#dash-donut-seg1, #dash-donut-seg2, #dash-donut-seg3", { strokeDasharray: "0 188" });
    
    // Animation sequence
    tl.to("#dash-tablet", { opacity: 1, y: 0, scale: 1, duration: 0.8 })
      .to("#dash-sidebar", { opacity: 1, x: 0, duration: 0.6 }, "-=0.4")
      .to("#dash-header", { scaleX: 1, duration: 0.5 }, "-=0.3")
      .to("#dash-card-activity", { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
      .to("#dash-card-overview", { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
      .to("#dash-ratios", { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
      .to("#dash-bar1", { scaleY: 1, duration: 0.4 }, "-=0.1")
      .to("#dash-bar2", { scaleY: 1, duration: 0.4 }, "-=0.3")
      .to("#dash-bar3", { scaleY: 1, duration: 0.4 }, "-=0.3")
      .to("#dash-bar4", { scaleY: 1, duration: 0.4 }, "-=0.3")
      .to("#dash-pie-float", { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }, "-=0.6")
      .to("#dash-donut-float", { opacity: 1, scale: 1, duration: 0.6 }, "-=0.4")
      .to("#dash-donut-seg1", { strokeDasharray: "70 188", duration: 0.8, ease: "power1.inOut" }, "-=0.3")
      .to("#dash-donut-seg2", { strokeDasharray: "50 188", duration: 0.8, ease: "power1.inOut" }, "-=0.6")
      .to("#dash-donut-seg3", { strokeDasharray: "35 188", duration: 0.8, ease: "power1.inOut" }, "-=0.6")
      // Hold for a moment then float
      .to("#dash-pie-float", { y: -15, duration: 1.5, ease: "sine.inOut" }, "+=0.5")
      .to("#dash-pie-float", { y: 0, duration: 1.5, ease: "sine.inOut" })
      .to("#dash-tablet", { y: -8, rotation: 1, duration: 1.5, ease: "sine.inOut" }, "-=3")
      .to("#dash-tablet", { y: 0, rotation: 0, duration: 1.5, ease: "sine.inOut" }, "-=1.5");
  };

  // ── COURSES SVG ANIMATION (Continuous Loop) ──
  const animateCourses = () => {
    if (!document.getElementById('coursesSVG')) return;
    
    // Main timeline that loops
    const tl = gsap.timeline({ 
      defaults: { ease: "power2.out" },
      repeat: -1,
      repeatDelay: 0.5
    });
    
    // Initial states
    tl.set("#course-tablet", { opacity: 0, y: 50, scale: 0.9 })
      .set("#course-header", { scaleX: 0, transformOrigin: "left" })
      .set("#course-title", { opacity: 0, x: -20 })
      .set("#course-card1, #course-card2, #course-card3, #course-card4, #course-card5, #course-card6", { 
        opacity: 0, y: 30, scale: 0.8 
      })
      .set("#course-badge", { opacity: 0, scale: 0, rotation: -20 })
      .set("#course-book", { opacity: 0, x: -30, rotation: -15 })
      .set("#course-pencil", { opacity: 0, y: -30, rotation: 45 })
      .set("#course-star", { opacity: 0, scale: 0, rotation: -90 })
      .set("#course-abc", { opacity: 0, x: -20 })
      .set("#course-dot1, #course-dot2, #course-dot3, #course-dot4, #course-dot5", { opacity: 0, scale: 0 });
    
    // Animation sequence
    tl.to("#course-tablet", { opacity: 1, y: 0, scale: 1, duration: 0.8 })
      .to("#course-header", { scaleX: 1, duration: 0.5 }, "-=0.3")
      .to("#course-title", { opacity: 1, x: 0, duration: 0.4 }, "-=0.2")
      .to("#course-card1", { opacity: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.1")
      .to("#course-card2", { opacity: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.3")
      .to("#course-card3", { opacity: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.3")
      .to("#course-card4", { opacity: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.2")
      .to("#course-card5", { opacity: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.3")
      .to("#course-card6", { opacity: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.3")
      .to("#course-badge", { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)" }, "-=0.2")
      // Floating decorations pop in
      .to("#course-book", { opacity: 1, x: 0, rotation: 0, duration: 0.5, ease: "back.out(1.5)" }, "-=0.4")
      .to("#course-pencil", { opacity: 1, y: 0, rotation: 25, duration: 0.5, ease: "back.out(1.5)" }, "-=0.4")
      .to("#course-star", { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" }, "-=0.4")
      .to("#course-abc", { opacity: 1, x: 0, duration: 0.4 }, "-=0.3")
      .to("#course-dot1", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.3")
      .to("#course-dot2", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.15")
      .to("#course-dot3", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.15")
      .to("#course-dot4", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.15")
      .to("#course-dot5", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.15")
      .to("#course-dot1, #course-dot2, #course-dot3, #course-dot4, #course-dot5", { scale: 1, duration: 0.2 })
      // Floating animations
      .to("#course-tablet", { y: -10, rotation: -1, duration: 1.2, ease: "sine.inOut" }, "+=0.2")
      .to("#course-badge", { y: -10, rotation: 5, duration: 1, ease: "sine.inOut" }, "-=1.2")
      .to("#course-book", { y: -8, rotation: 5, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#course-pencil", { y: -12, rotation: 30, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#course-star", { y: -10, rotation: 15, scale: 1.1, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#course-abc", { y: -6, duration: 1, ease: "sine.inOut" }, "-=1")
      // Float back
      .to("#course-tablet", { y: 0, rotation: 0, duration: 1.2, ease: "sine.inOut" })
      .to("#course-badge", { y: 0, rotation: 0, duration: 1, ease: "sine.inOut" }, "-=1.2")
      .to("#course-book", { y: 0, rotation: 0, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#course-pencil", { y: 0, rotation: 25, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#course-star", { y: 0, rotation: 0, scale: 1, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#course-abc", { y: 0, duration: 1, ease: "sine.inOut" }, "-=1");
  };

  // ── PLANNER SVG ANIMATION (Continuous Loop) ──
  const animatePlanner = () => {
    if (!document.getElementById('plannerSVG')) return;
    
    // Main timeline that loops
    const tl = gsap.timeline({ 
      defaults: { ease: "power2.out" },
      repeat: -1,
      repeatDelay: 0.5
    });
    
    // Initial states - tablet content
    tl.set("#planner-tablet", { opacity: 0, y: 50, scale: 0.9 })
      .set("#planner-header", { opacity: 0, y: -20 })
      .set("#planner-toolbar", { opacity: 0, x: -30 })
      .set("#planner-divider", { scaleX: 0, transformOrigin: "left" })
      .set("#planner-day-mon, #planner-day-tue, #planner-day-wed", { opacity: 0, y: 20 })
      .set("#planner-slot1, #planner-slot2, #planner-slot3, #planner-slot4, #planner-slot5, #planner-slot6", { 
        opacity: 0, scale: 0.7, transformOrigin: "center" 
      })
      // Initial states - confetti (all start at box position for burst)
      .set("#confetti-box", { opacity: 0, scale: 0.3, y: 30 })
      .set("#box-lid", { rotation: 0, transformOrigin: "0 -20px" })
      .set("#confetti-crayon", { opacity: 0, x: 105, y: 310, scale: 0.2 })
      .set("#confetti-puzzle", { opacity: 0, x: -90, y: 300, scale: 0.2 })
      .set("#confetti-scissors", { opacity: 0, x: -175, y: 270, scale: 0.2 })
      .set("#confetti-palette", { opacity: 0, x: -200, y: 170, scale: 0.2 })
      .set("#confetti-card1", { opacity: 0, x: 50, y: 60, scale: 0.2, rotation: 0 })
      .set("#confetti-card2", { opacity: 0, x: -60, y: 65, scale: 0.2, rotation: 0 })
      .set("#confetti-dot1, #confetti-dot2, #confetti-dot3, #confetti-dot4, #confetti-dot5, #confetti-dot6, #confetti-dot7", { 
        opacity: 0, scale: 0 
      })
      .set("#sparkle1, #sparkle2, #sparkle3", { opacity: 0, scale: 0 });
    
    // Animation sequence - tablet
    tl.to("#planner-tablet", { opacity: 1, y: 0, scale: 1, duration: 0.8 })
      .to("#planner-header", { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
      .to("#planner-toolbar", { opacity: 1, x: 0, duration: 0.4 }, "-=0.2")
      .to("#planner-divider", { scaleX: 1, duration: 0.4 }, "-=0.1")
      .to("#planner-day-mon", { opacity: 1, y: 0, duration: 0.3 }, "-=0.1")
      .to("#planner-day-tue", { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
      .to("#planner-day-wed", { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
      .to("#planner-slot1", { opacity: 1, scale: 1, duration: 0.35 }, "-=0.1")
      .to("#planner-slot2", { opacity: 1, scale: 1, duration: 0.35 }, "-=0.25")
      .to("#planner-slot3", { opacity: 1, scale: 1, duration: 0.35 }, "-=0.25")
      .to("#planner-slot4", { opacity: 1, scale: 1, duration: 0.35 }, "-=0.2")
      .to("#planner-slot5", { opacity: 1, scale: 1, duration: 0.35 }, "-=0.25")
      .to("#planner-slot6", { opacity: 1, scale: 1, duration: 0.35 }, "-=0.25")
      
      // Box appears with bounce
      .to("#confetti-box", { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2)" }, "+=0.2")
      
      // Lid POPS open dramatically
      .to("#box-lid", { rotation: -60, duration: 0.25, ease: "power4.out" })
      
      // CONFETTI BURST - items EXPLODE out from box with overshoot
      .to("#confetti-card1", { opacity: 1, x: 0, y: -10, scale: 1.1, rotation: -20, duration: 0.4, ease: "power4.out" }, "-=0.15")
      .to("#confetti-card2", { opacity: 1, x: 0, y: -10, scale: 1.1, rotation: 15, duration: 0.4, ease: "power4.out" }, "-=0.38")
      .to("#confetti-crayon", { opacity: 1, x: 0, y: -8, scale: 1.1, rotation: -30, duration: 0.45, ease: "power4.out" }, "-=0.35")
      .to("#confetti-puzzle", { opacity: 1, x: 0, y: -8, scale: 1.1, rotation: 20, duration: 0.45, ease: "power4.out" }, "-=0.42")
      .to("#confetti-scissors", { opacity: 1, x: 0, y: -8, scale: 1.1, rotation: 25, duration: 0.45, ease: "power4.out" }, "-=0.42")
      .to("#confetti-palette", { opacity: 1, x: 0, y: -8, scale: 1.1, rotation: 5, duration: 0.45, ease: "power4.out" }, "-=0.42")
      
      // Items settle to final position
      .to("#confetti-card1, #confetti-card2", { y: 0, scale: 1, duration: 0.3, ease: "power2.out" }, "-=0.1")
      .to("#confetti-crayon, #confetti-puzzle, #confetti-scissors, #confetti-palette", { y: 0, scale: 1, rotation: "+=5", duration: 0.3, ease: "power2.out" }, "-=0.3")
      
      // Confetti dots POP in rapid succession
      .to("#confetti-dot1", { opacity: 1, scale: 1.5, duration: 0.15, ease: "power4.out" }, "-=0.2")
      .to("#confetti-dot2", { opacity: 1, scale: 1.5, duration: 0.15, ease: "power4.out" }, "-=0.12")
      .to("#confetti-dot3", { opacity: 1, scale: 1.5, duration: 0.15, ease: "power4.out" }, "-=0.12")
      .to("#confetti-dot4", { opacity: 1, scale: 1.5, duration: 0.15, ease: "power4.out" }, "-=0.12")
      .to("#confetti-dot5", { opacity: 1, scale: 1.5, duration: 0.15, ease: "power4.out" }, "-=0.12")
      .to("#confetti-dot6", { opacity: 1, scale: 1.5, duration: 0.15, ease: "power4.out" }, "-=0.12")
      .to("#confetti-dot7", { opacity: 1, scale: 1.5, duration: 0.15, ease: "power4.out" }, "-=0.12")
      
      // Sparkles burst
      .to("#sparkle1, #sparkle2, #sparkle3", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out", stagger: 0.05 }, "-=0.3")
      
      // Everything settles
      .to("#confetti-dot1, #confetti-dot2, #confetti-dot3, #confetti-dot4, #confetti-dot5, #confetti-dot6, #confetti-dot7", { 
        scale: 1, duration: 0.25, ease: "elastic.out(1, 0.5)" 
      })
      .to("#sparkle1, #sparkle2, #sparkle3", { scale: 1, duration: 0.25 }, "-=0.25")
      
      // Box lid bounces back partially
      .to("#box-lid", { rotation: -15, duration: 0.35, ease: "bounce.out" }, "-=0.4")
      
      // Floating animations
      .to("#planner-tablet", { y: -10, rotation: 1, duration: 1.2, ease: "sine.inOut" }, "+=0.1")
      .to("#confetti-crayon", { y: -12, rotation: -15, duration: 1, ease: "sine.inOut" }, "-=1.2")
      .to("#confetti-puzzle", { y: -15, rotation: 30, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#confetti-scissors", { y: -10, rotation: 30, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#confetti-palette", { y: -12, rotation: 10, duration: 1.2, ease: "sine.inOut" }, "-=1.2")
      .to("#confetti-box", { y: -6, duration: 1, ease: "sine.inOut" }, "-=1.2")
      .to("#confetti-card1", { y: -12, rotation: -22, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#confetti-card2", { y: -14, rotation: 18, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#sparkle1, #sparkle2, #sparkle3", { y: -8, rotation: 15, duration: 1, ease: "sine.inOut" }, "-=1")
      
      // Float back
      .to("#planner-tablet", { y: 0, rotation: 0, duration: 1.2, ease: "sine.inOut" })
      .to("#confetti-crayon", { y: 0, rotation: -25, duration: 1, ease: "sine.inOut" }, "-=1.2")
      .to("#confetti-puzzle", { y: 0, rotation: 20, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#confetti-scissors", { y: 0, rotation: 25, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#confetti-palette", { y: 0, rotation: 5, duration: 1.2, ease: "sine.inOut" }, "-=1.2")
      .to("#confetti-box", { y: 0, duration: 1, ease: "sine.inOut" }, "-=1.2")
      .to("#confetti-card1", { y: 0, rotation: -15, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#confetti-card2", { y: 0, rotation: 10, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#sparkle1, #sparkle2, #sparkle3", { y: 0, rotation: 0, duration: 1, ease: "sine.inOut" }, "-=1");
  };

  // ── FAMILY ENGAGEMENT SVG ANIMATION (Continuous Loop) ──
  const animateFamily = () => {
    if (!document.getElementById('familySVG')) return;
    
    // Main timeline that loops
    const tl = gsap.timeline({ 
      defaults: { ease: "power2.out" },
      repeat: -1,
      repeatDelay: 0.5
    });
    
    // Initial states
    tl.set("#family-phone", { opacity: 0, y: 60, scale: 0.9 })
      .set("#family-child1", { opacity: 0, y: 30 })
      .set("#family-child2", { opacity: 0, x: 20 })
      .set("#family-dailysheet", { opacity: 0, x: 50, y: -30, scale: 0.5 })
      .set("#family-profile", { opacity: 0, x: 30, scale: 0.5 })
      .set("#family-message", { opacity: 0, y: 40, x: -30, scale: 0.5 })
      .set("#family-food", { opacity: 0, x: -40, scale: 0.5 })
      .set("#family-camera", { opacity: 0, scale: 0, rotation: -90 })
      .set("#family-emoji1", { opacity: 0, scale: 0 })
      .set("#family-emoji2", { opacity: 0, scale: 0 })
      .set("#family-dot1, #family-dot2, #family-dot3, #family-dot4", { opacity: 0, scale: 0 });
    
    // Animation sequence
    tl.to("#family-phone", { opacity: 1, y: 0, scale: 1, duration: 0.8 })
      .to("#family-child1", { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
      .to("#family-child2", { opacity: 1, x: 0, duration: 0.4 }, "-=0.3")
      
      // Cards fly in
      .to("#family-dailysheet", { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.2")
      .to("#family-profile", { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, "-=0.3")
      .to("#family-message", { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.3")
      .to("#family-food", { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, "-=0.35")
      
      // Icons pop
      .to("#family-camera", { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2)" }, "-=0.2")
      .to("#family-emoji1", { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, "-=0.25")
      .to("#family-emoji2", { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, "-=0.2")
      
      // Dots pop
      .to("#family-dot1", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.3")
      .to("#family-dot2", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.15")
      .to("#family-dot3", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.15")
      .to("#family-dot4", { opacity: 1, scale: 1.3, duration: 0.2, ease: "power4.out" }, "-=0.15")
      .to("#family-dot1, #family-dot2, #family-dot3, #family-dot4", { scale: 1, duration: 0.2 })
      
      // Floating animations
      .to("#family-phone", { y: -10, rotation: 1, duration: 1.2, ease: "sine.inOut" }, "+=0.2")
      .to("#family-dailysheet", { y: -12, rotation: -3, duration: 1.1, ease: "sine.inOut" }, "-=1.2")
      .to("#family-profile", { y: -8, x: 5, duration: 1, ease: "sine.inOut" }, "-=1.1")
      .to("#family-message", { y: -10, rotation: 2, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#family-food", { y: -8, rotation: -2, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#family-camera", { y: -10, rotation: 15, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#family-emoji1", { y: -8, scale: 1.1, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#family-emoji2", { y: -6, scale: 1.1, duration: 0.9, ease: "sine.inOut" }, "-=0.9")
      
      // Float back
      .to("#family-phone", { y: 0, rotation: 0, duration: 1.2, ease: "sine.inOut" })
      .to("#family-dailysheet", { y: 0, rotation: 0, duration: 1.1, ease: "sine.inOut" }, "-=1.2")
      .to("#family-profile", { y: 0, x: 0, duration: 1, ease: "sine.inOut" }, "-=1.1")
      .to("#family-message", { y: 0, rotation: 0, duration: 1.1, ease: "sine.inOut" }, "-=1.1")
      .to("#family-food", { y: 0, rotation: 0, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#family-camera", { y: 0, rotation: 0, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#family-emoji1", { y: 0, scale: 1, duration: 1, ease: "sine.inOut" }, "-=1")
      .to("#family-emoji2", { y: 0, scale: 1, duration: 0.9, ease: "sine.inOut" }, "-=0.9");
  };

  // Initialize SVG animations immediately on page load
  animateDashboard();
  animateCourses();
  animatePlanner();
  animateFamily();

});
