document.addEventListener('DOMContentLoaded', () => {

  // ── MAP ──────────────────────────────────────────────────────────────────

  try {

  const routeCoords = [
    [42.36701629560474, -71.05851364409887],
    [42.370874167376, -71.06163589450246],
    [42.36962623182157, -71.06721564165711],
    [42.37019355413631, -71.06870023699022],
    [42.369815374855904, -71.06967288389886],
    [42.37079862543021, -71.07161823450349],
    [42.36387703696508, -71.07837561611623],
    [42.361318272539506, -71.07856355126128],
    [42.360506181429486, -71.07988239013079],
    [42.360668605822326, -71.08191559936456],
    [42.3571765371955, -71.09252110060879],
    [42.35188490284068, -71.0900527777897],
    [42.35332696790459, -71.08466696198103],
    [42.35390315263166, -71.08477328206058],
    [42.35636497332749, -71.07580695532833],
    [42.35709826297858, -71.07513359482266],
    [42.35717682921921, -71.07403495399757],
    [42.35712445173638, -71.07371599375828],
    [42.36026702344407, -71.0726173529332],
    [42.36115739018794, -71.07304263325261],
    [42.36395934437439, -71.07275911303927],
    [42.36464017418456, -71.07205031250707],
    [42.36492821534486, -71.07098711170907],
    [42.36477545952158, -71.07006373931472],
    [42.36603235400361, -71.06914229862281],
    [42.36676553083859, -71.0682208579309],
    [42.36760341657083, -71.06673238816592],
    [42.3677343383591, -71.0655628672878],
    [42.36694880353713, -71.0644996664898],
    [42.36634655352168, -71.06393262606368],
    [42.36553481610426, -71.06400350611672],
    [42.36524677772519, -71.06407438617035],
    [42.36453976883237, -71.06325926555802],
    [42.36689643419987, -71.05865206209846]
  ];

  const startLocation = [42.36701629560474, -71.05851364409887];

  const map = L.map('boston-map', {
    center: [42.362, -71.074],
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Navy tint overlay
  L.rectangle([[-90, -180], [90, 180]], {
    color: 'transparent', fillColor: '#1c3f7a', fillOpacity: 0.25, stroke: false
  }).addTo(map);

  // Glow layer
  L.polyline(routeCoords, {
    color: 'rgba(232, 168, 32, 0.2)', weight: 12, lineCap: 'round', lineJoin: 'round'
  }).addTo(map);

  // Main route
  L.polyline(routeCoords, {
    color: '#e8a820', weight: 4, lineCap: 'round', lineJoin: 'round'
  }).addTo(map);

  // Start/finish dot
  L.marker(startLocation, {
    icon: L.divIcon({
      html: '<div style="width:13px;height:13px;border-radius:50%;background:#3a9e5f;border:2.5px solid rgba(245,242,236,0.85);box-shadow:0 0 0 3px rgba(58,158,95,0.2);"></div>',
      className: '', iconSize: [13, 13], iconAnchor: [6, 6]
    })
  }).addTo(map);

  map.invalidateSize();

  } catch (e) { console.warn('Map failed to load:', e); }


  // ── CAROUSEL ─────────────────────────────────────────────────────────────

  let currentSlide = 0;
  const totalSlides = 9;
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
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) })
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
