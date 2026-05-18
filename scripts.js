document.addEventListener('DOMContentLoaded', () => {

  // ── MAP ──────────────────────────────────────────────────────────────────

  try {

  const map = L.map('boston-map', {
    center: [42.362, -71.074],
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Load the Charles River West End route from the generated /routes/ tree.
  fetch('/routes/charles-river-west-end/route.gpx')
    .then(r => r.text())
    .then(text => {
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      const points = Array.from(xml.querySelectorAll('trkpt')).map(pt => [
        parseFloat(pt.getAttribute('lat')),
        parseFloat(pt.getAttribute('lon'))
      ]);
      if (!points.length) return;

      // Soft gold glow under-layer
      L.polyline(points, {
        color: 'rgba(245, 200, 66, 0.28)', weight: 12, lineCap: 'round', lineJoin: 'round'
      }).addTo(map);

      // Main route line
      const line = L.polyline(points, {
        color: '#F5C842', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round'
      }).addTo(map);

      // Start dot (matches the detail-page treatment)
      L.marker(points[0], {
        icon: L.divIcon({
          html: '<div style="width:18px;height:18px;border-radius:50%;background:#2DAA5F;border:3px solid white;box-shadow:0 0 0 2px #1C3F7A;"></div>',
          className: '', iconSize: [18, 18], iconAnchor: [9, 9]
        })
      })
        .bindTooltip('Meeting Point: Museum of Science T.Rex', {
          direction: 'top',
          offset: [0, -6],
          className: 'start-tooltip',
        })
        .addTo(map);

      map.fitBounds(line.getBounds(), { padding: [50, 50] });
    })
    .catch(e => console.warn('Failed to load Charles River West End route:', e));

  map.invalidateSize();

  } catch (e) { console.warn('Map failed to load:', e); }


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
        emailInput.style.borderColor = '#e8a820';
        emailInput.focus();
      }
      return;
    }

    const payload = { source: context, email: emailInput.value.trim() };

    if (context === 'footer') {
      payload.name = document.getElementById('footer-name').value.trim();
      payload.pace = document.getElementById('footer-pace').value;
      payload.time = document.getElementById('footer-time').value;
      payload.neighborhood = document.getElementById('footer-neighborhood').value;

      const btn = document.querySelector('.signup-btn[data-context="footer"]');
      btn.disabled = true;
      btn.textContent = "You're on the list!";
      btn.style.background = '#3d3b36';
      document.getElementById('footer-success').hidden = false;
    }

    submitToSheets(payload);
  }

  function submitToSheets(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMcJ5fB0PrSLX9__KH9UYSwAQdx2bUspEbD2WnfGC8QZMFvEWjarXBSUGfbjlT1EE1gQ/exec';
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) })
      .catch(err => console.error('Submission error:', err));
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
