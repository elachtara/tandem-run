document.addEventListener('DOMContentLoaded', () => {

  // ── CAROUSEL ─────────────────────────────────────────────────────────────

  let currentSlide = 0;
  const totalSlides = 12;
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('.carousel-dot');

  function updateCarousel() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
      dot.setAttribute('aria-selected', String(i === currentSlide));
    });
  }

  function moveCarousel(dir) {
    currentSlide = (currentSlide + dir + totalSlides) % totalSlides;
    updateCarousel();
  }

  document.querySelectorAll('.carousel-btn').forEach(btn => {
    btn.addEventListener('click', () => moveCarousel(Number(btn.dataset.dir)));
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentSlide = i;
      updateCarousel();
    });
  });

  setInterval(() => moveCarousel(1), 5000);


  // ── FORMS ─────────────────────────────────────────────────────────────────

  document.querySelectorAll('.signup-btn').forEach(btn => {
    btn.addEventListener('click', () => handleSignup(btn.dataset.context));
  });

  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSignup(this.id.split('-')[0]);
      }
      this.style.borderColor = '';
    });
  });

  function handleSignup(context) {
    const emailInput = document.getElementById(`${context}-email`);
    if (!emailInput || !emailInput.value.trim().includes('@')) {
      if (emailInput) {
        emailInput.style.borderColor = 'var(--berry)';
        emailInput.focus();
      }
      return;
    }

    const payload = { source: context, email: emailInput.value.trim() };

    if (context === 'footer') {
      const fields = {
        name: 'footer-name',
        neighborhood: 'footer-neighborhood',
        pace: 'footer-pace',
        // Payload key stays `time` — the Google Apps Script that writes
        // to the Sheet is keyed on this name. DOM id is footer-when.
        time: 'footer-when',
      };
      for (const [key, id] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) payload[key] = el.value.trim();
      }

      const btn = document.querySelector('.signup-btn[data-context="footer"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = "you're on the list!";
        btn.style.background = 'var(--berry-deep)';
      }
      const success = document.getElementById('footer-success');
      if (success) success.hidden = false;
    }

    submitToSheets(payload);
  }

  function submitToSheets(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMcJ5fB0PrSLX9__KH9UYSwAQdx2bUspEbD2WnfGC8QZMFvEWjarXBSUGfbjlT1EE1gQ/exec';
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) })
      .catch(err => console.error('Submission error:', err));
  }


  // ── SCROLL FADE-IN ────────────────────────────────────────────────────────

  const fadeTargets = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window && fadeTargets.length) {
    // Enable the hidden initial state only now that JS is running.
    document.documentElement.classList.add('fades-on');
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    fadeTargets.forEach(el => fadeObserver.observe(el));
  }


  // ── SMOOTH SCROLL ─────────────────────────────────────────────────────────

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
