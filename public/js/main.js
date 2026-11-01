/**
 * Pune Corporate Cars India Pvt. Ltd. - Main Client Application Logic
 * Integrates real vehicle fleet, quick enquiry, pan-india network, and verified reviews.
 */

let allFleet = [];
let allLocations = [];

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  loadFleet();
  loadPricing();
  loadLocations();
  loadDirectors();
  loadTestimonials();
  loadBlogs();
  initFaqAccordion();
  initQuickEnquiryForm();
  initBookingModal();
  initHeroConsole();
});

// Toast Notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Navigation Bar
function initNavbar() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeMobileDrawer = document.getElementById('closeMobileDrawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeMobileDrawer && mobileDrawer) {
    closeMobileDrawer.addEventListener('click', () => {
      mobileDrawer.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Pay Modal triggers
  const payModal = document.getElementById('payModal');
  const closePayModal = document.getElementById('closePayModal');
  if (closePayModal && payModal) {
    closePayModal.addEventListener('click', () => {
      payModal.classList.remove('active');
    });
    payModal.addEventListener('click', (e) => {
      if (e.target === payModal) payModal.classList.remove('active');
    });
  }
}

window.openMobileMenu = function () {
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) {
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeMobileMenu = function () {
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.openPayModal = function () {
  const payModal = document.getElementById('payModal');
  if (payModal) payModal.classList.add('active');
};

window.closePayModal = function () {
  const payModal = document.getElementById('payModal');
  if (payModal) payModal.classList.remove('active');
};

// 1. Load Fleet with REAL PHOTOGRAPHY
async function loadFleet(category = 'all') {
  const grid = document.getElementById('fleetGrid');
  const quickVehicleSelect = document.getElementById('quickVehicleSelect');
  const modalVehicleSelect = document.getElementById('modalVehicleSelect');

  try {
    const res = await fetch(`/api/fleet?category=${category}`);
    const data = await res.json();
    if (!data.success) return;

    allFleet = data.data;

    // Populate dropdowns once
    if (quickVehicleSelect && quickVehicleSelect.options.length <= 1) {
      quickVehicleSelect.innerHTML = '<option value="">Select Vehicle Preference (Optional)</option>';
      allFleet.forEach(car => {
        const opt = document.createElement('option');
        opt.value = car.id;
        opt.text = `${car.model} (${car.category_label})`;
        quickVehicleSelect.appendChild(opt);
      });
    }

    if (modalVehicleSelect) {
      modalVehicleSelect.innerHTML = '';
      allFleet.forEach(car => {
        const opt = document.createElement('option');
        opt.value = car.id;
        opt.text = `${car.model} (${car.category_label})`;
        modalVehicleSelect.appendChild(opt);
      });
    }

    // Render 15-Model Fleet Cards
    if (grid) {
      grid.innerHTML = allFleet.map(car => `
        <div class="fleet-card-luxury" data-category="${car.category}">
          <div class="fleet-img-frame">
            <span class="fleet-category-badge">${car.category_label}</span>
            <img src="${car.image_url}" alt="${car.model}" class="fleet-real-img" loading="lazy" 
                 onerror="this.src='/assets/cars/mercedes-e220.jpg'">
          </div>
          <div class="fleet-info-body">
            <div class="fleet-title-row">
              <h3>${car.model}</h3>
              <span>${car.category_label} • Corporate Fleet</span>
            </div>
            
            <div class="fleet-specs-grid">
              <div class="fleet-spec-cell">
                <span>👥</span> <strong>${car.passengers} Passengers</strong>
              </div>
              <div class="fleet-spec-cell">
                <span>❄️</span> <strong>AC &amp; Climate Control</strong>
              </div>
              <div class="fleet-spec-cell">
                <span>🧳</span> <strong>${car.luggage}</strong>
              </div>
              <div class="fleet-spec-cell">
                <span>📍</span> <strong>GPS Live Telemetry</strong>
              </div>
            </div>

            <div class="fleet-features-pills">
              ${car.features.map(f => `<span class="pill-luxury">${f}</span>`).join('')}
            </div>

            <div class="fleet-card-action-bar">
              <div>
                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Rate Structure</div>
                <div style="font-size: 0.95rem; color: var(--primary-gold); font-weight: 700;">Corporate Rate / Quote</div>
              </div>
              <button class="btn-gold" style="padding: 0.5rem 1rem; font-size: 0.82rem;" onclick="selectCarForBooking(${car.id})">
                Book This Car →
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Category Filter Buttons
    const filterButtons = document.querySelectorAll('.fleet-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.category;
        loadFleet(cat);
      });
    });

  } catch (err) {
    console.error('Failed to load fleet:', err);
  }
}

window.selectCarForBooking = function (carId) {
  const car = allFleet.find(c => c.id === carId);
  if (!car) return;

  openBookingModal({
    service_type: 'Corporate Car Rental',
    vehicle_id: car.id,
    vehicle_name: car.model,
    pickup_city: 'Pune'
  });
};

// 2. Load Pricing Packages
async function loadPricing() {
  const grid = document.getElementById('pricingGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/pricing');
    const json = await res.json();
    if (!json.success) return;

    grid.innerHTML = json.data.map(pkg => `
      <div class="pricing-card-luxury ${pkg.popular ? 'popular' : ''}">
        ${pkg.popular ? '<span class="badge-popular-gold">Corporate Standard</span>' : ''}
        <div class="pricing-cat-tag">${pkg.category_tag}</div>
        <h3>${pkg.title}</h3>
        <div class="pricing-price-val">${pkg.price_display}</div>
        <div class="pricing-duration">${pkg.duration_km} • ${pkg.extra_km_rate}</div>

        <ul class="pricing-inclusions-list">
          ${pkg.inclusions.map(inc => `<li>${inc}</li>`).join('')}
        </ul>

        <button class="${pkg.popular ? 'btn-gold' : 'btn-luxury-outline'}" style="width: 100%; margin-top: auto;" onclick="openBookingForPackage('${pkg.title}')">
          Request Quotation →
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load pricing packages:', err);
  }
}

window.openBookingForPackage = function (packageTitle) {
  openBookingModal({
    service_type: packageTitle.includes('Airport') ? 'Airport Transfers' :
                  packageTitle.includes('Outstation') ? 'Intercity / outstation travel' :
                  packageTitle.includes('Employee') ? 'Employee transportation' : 'Corporate car rental',
    special_requests: `Quotation requested for: ${packageTitle}`
  });
};

// 3. Load Key Directors (Both Sanjay Nalawade & Prashant Nalawade)
async function loadDirectors() {
  const container = document.getElementById('directorsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/directors');
    const json = await res.json();
    if (!json.success || !json.data.length) return;

    container.innerHTML = `
      <div class="directors-luxury-grid">
        ${json.data.map(director => `
          <div class="founder-card-luxury">
            <div class="founder-avatar-gold">${director.avatar_initials}</div>
            <div class="founder-info">
              <h3>${director.name}</h3>
              <div class="founder-title-gold">${director.title} • Pune Corporate Cars India Pvt. Ltd.</div>
              <p class="founder-text">${director.role_description}</p>
              <div class="founder-meta-row">
                <div>✉ Direct Email: <a href="mailto:${director.email}">${director.email}</a></div>
                <div>📍 Base Location: <strong>Pune, Maharashtra, India</strong></div>
                <div>★ Corporate Leadership: <strong>${director.experience || 'Key Director'}</strong></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Failed to load directors:', err);
  }
}

// 4. Load Pan-India Locations (Grouped State-Wise per Client Requirement)
async function loadLocations(query = '') {
  const container = document.getElementById('locationsGrid');
  if (!container) return;

  try {
    const res = await fetch(`/api/locations${query ? `?query=${encodeURIComponent(query)}` : ''}`);
    const json = await res.json();
    if (!json.success) return;

    allLocations = json.data;

    if (allLocations.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted); grid-column: 1 / -1; width: 100%;">
          <p>No locations found matching "<strong>${query}</strong>". Contact our 24×7 helpdesk (+91 9822943334) for custom city routes.</p>
        </div>
      `;
      return;
    }

    // Group locations by State
    const stateGroups = {};
    allLocations.forEach(loc => {
      const state = loc.state || 'Other Regions';
      if (!stateGroups[state]) stateGroups[state] = [];
      stateGroups[state].push(loc);
    });

    // Sort states with Maharashtra first (Corporate HQ), then alphabetically
    const sortedStates = Object.keys(stateGroups).sort((a, b) => {
      if (a.toLowerCase().includes('maharashtra')) return -1;
      if (b.toLowerCase().includes('maharashtra')) return 1;
      return a.localeCompare(b);
    });

    container.innerHTML = sortedStates.map(state => {
      const cities = stateGroups[state];
      const isHqState = state.toLowerCase().includes('maharashtra');
      return `
        <div class="state-network-card ${isHqState ? 'state-card-hq' : ''}">
          <div class="state-card-header">
            <div class="state-title-wrap">
              <span class="state-icon">${isHqState ? '⭐' : '📍'}</span>
              <h4>${state} ${isHqState ? '<span class="hq-badge">HQ State</span>' : ''}</h4>
            </div>
            <span class="state-count-pill">${cities.length} ${cities.length === 1 ? 'City' : 'Cities'}</span>
          </div>

          <div class="state-cities-grid">
            ${cities.map(c => `
              <div class="city-chip-luxury ${c.is_major ? 'major' : ''}" title="${c.city}, ${c.state}">
                <div class="city-main-info">
                  <span class="city-dot"></span>
                  <span class="city-title">${c.city}</span>
                </div>
                ${c.airport_code ? `<span class="city-airport-code">${c.airport_code}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    const searchInput = document.getElementById('locationSearchInput');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.addEventListener('input', (e) => {
        loadLocations(e.target.value.trim());
      });
    }
  } catch (err) {
    console.error('Failed to load locations:', err);
  }
}

// 5. Load Verified Testimonials from PDF Page 5 & 6
async function loadTestimonials() {
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/testimonials');
    const json = await res.json();
    if (!json.success) return;

    grid.innerHTML = json.data.map(t => `
      <div class="testimonial-card-luxury">
        <div class="star-rating-gold">★★★★★</div>
        <div class="testimonial-quote-text">“${t.comment}”</div>
        <div class="testimonial-author-box">
          <h4>${t.author_name}</h4>
          <p>${t.designation} — ${t.company}</p>
          <div class="city-sub">Verified Client Reference • ${t.city}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load testimonials:', err);
  }
}

// 6. Load Blog Topics from PDF Page 6
async function loadBlogs() {
  const grid = document.getElementById('blogsGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/blogs');
    const json = await res.json();
    if (!json.success) return;

    grid.innerHTML = json.data.map(b => `
      <div class="blog-card-luxury">
        <div class="blog-tag-gold">${b.category}</div>
        <h3>${b.title}</h3>
        <p>${b.summary}</p>
        <div class="blog-footer-meta">
          <span>⏱ ${b.read_time}</span>
          <span>📅 ${b.date_published}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load blogs:', err);
  }
}

// 7. Quick Enquiry Form (From PDF Page 7 Item 3 & Page 9 Item 12)
function initQuickEnquiryForm() {
  const form = document.getElementById('quickEnquiryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Submitting Enquiry...';

    const formData = new FormData(form);
    const selCar = document.getElementById('quickVehicleSelect');
    const vehicleName = selCar && selCar.value ? selCar.options[selCar.selectedIndex].text : 'Vehicle preference to be confirmed';

    const payload = {
      customer_name: formData.get('contact_name'),
      company_name: formData.get('company_name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      service_type: formData.get('service_type'),
      vehicle_id: formData.get('vehicle_id') || null,
      vehicle_name: vehicleName,
      pickup_city: formData.get('pickup_city'),
      destination: formData.get('destination'),
      pickup_date: formData.get('travel_date'),
      pickup_time: formData.get('travel_time') || '09:00 AM',
      passengers: Number(formData.get('passenger_count')) || 1,
      luggage_bags: 1,
      estimated_fare: 0,
      special_requests: `Quick Enquiry from homepage. Message: ${formData.get('message') || 'None'}`
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      if (res.success) {
        form.reset();
        showConfirmationModal(res.bookingRef, payload);
        showToast(`Enquiry registered! Reference ID: ${res.bookingRef}`, 'success');
      } else {
        showToast(res.error || 'Failed to submit enquiry', 'error');
      }
    } catch (err) {
      showToast('Network error while submitting enquiry. Please call our 24x7 desk: +91 9822943334', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  });
}

// 8. Interactive Booking Modal
function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  const closeBtn = document.getElementById('closeBookingModal');
  const form = document.getElementById('bookingForm');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // Pre-fill today's date
  const dateInput = document.getElementById('modalDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting...';

      const formData = new FormData(form);
      const selVehicle = document.getElementById('modalVehicleSelect');
      const vehicleName = selVehicle ? selVehicle.options[selVehicle.selectedIndex].text : '';

      const payload = {
        customer_name: formData.get('customer_name'),
        company_name: formData.get('company_name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        service_type: formData.get('service_type'),
        vehicle_id: formData.get('vehicle_id'),
        vehicle_name: vehicleName,
        pickup_city: formData.get('pickup_city'),
        destination: formData.get('destination'),
        pickup_date: formData.get('pickup_date'),
        pickup_time: formData.get('pickup_time'),
        passengers: formData.get('passengers'),
        luggage_bags: formData.get('luggage_bags'),
        estimated_fare: 0,
        special_requests: formData.get('special_requests')
      };

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const res = await response.json();
        if (res.success) {
          modal.classList.remove('active');
          form.reset();
          showConfirmationModal(res.bookingRef, payload);
          showToast(`Reservation registered! Ref: ${res.bookingRef}`, 'success');
        } else {
          showToast(res.error || 'Failed to submit booking', 'error');
        }
      } catch (err) {
        showToast('Network error while booking. Please call 24x7 desk: +91 9822943334', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
      }
    });
  }
}

window.openBookingModal = function (prefill = {}) {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  if (prefill.service_type) {
    const sel = document.getElementById('modalServiceType');
    if (sel) sel.value = prefill.service_type;
  }
  if (prefill.vehicle_id) {
    const vSel = document.getElementById('modalVehicleSelect');
    if (vSel) vSel.value = prefill.vehicle_id;
  }
  if (prefill.pickup_city) {
    const cityInput = document.getElementById('modalPickupCity');
    if (cityInput) cityInput.value = prefill.pickup_city;
  }
  if (prefill.special_requests) {
    const spec = document.getElementById('modalSpecialRequests');
    if (spec) spec.value = prefill.special_requests;
  }

  modal.classList.add('active');
};

function showConfirmationModal(bookingRef, data) {
  let confModal = document.getElementById('confirmModal');
  if (!confModal) {
    confModal = document.createElement('div');
    confModal.id = 'confirmModal';
    confModal.className = 'modal-overlay';
    document.body.appendChild(confModal);
  }

  confModal.innerHTML = `
    <div class="modal-content-luxury" style="text-align: center;">
      <div style="font-size: 2.8rem; margin-bottom: 0.75rem; color: var(--primary-gold);">✓</div>
      <h2 style="color: #fff; margin-bottom: 0.5rem; font-size: 1.45rem;">Corporate Enquiry Registered!</h2>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
        Your requirement has been logged into our central dispatch operations database.
      </p>

      <div style="background: var(--primary-gold-dim); border: 1px solid var(--primary-gold-border); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        <div style="font-size: 0.78rem; color: var(--primary-gold); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Enquiry Reference Number</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #ffffff; letter-spacing: 0.05em; margin: 0.35rem 0;">${bookingRef}</div>
        <div style="font-size: 0.85rem; color: var(--text-silver);">
          Vehicle: <strong>${data.vehicle_name}</strong> | Service: <strong>${data.service_type}</strong>
        </div>
      </div>

      <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 1.5rem; line-height: 1.5;">
        Our corporate travel team will review and share a proposal shortly. For immediate priority dispatch, contact our 24×7 helpdesk at <strong>+91 9822943334</strong>.
      </p>

      <button class="btn-gold" style="width: 100%; padding: 0.85rem;" onclick="document.getElementById('confirmModal').classList.remove('active')">
        Close Window
      </button>
    </div>
  `;

  confModal.classList.add('active');
}

// 9. FAQ Accordion
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const wasActive = item.classList.contains('active');
        items.forEach(i => i.classList.remove('active'));
        if (!wasActive) item.classList.add('active');
      });
    }
  });
}

// 10. Hero Floating Console (From Reference Image)
function initHeroConsole() {
  const heroDate = document.getElementById('heroDate');
  if (heroDate) {
    const today = new Date().toISOString().split('T')[0];
    heroDate.value = today;
    heroDate.min = today;
  }
}

window.filterFleetHero = function (cat) {
  document.querySelectorAll('.hero-cat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${cat}'`));
  });

  loadFleet(cat);

  document.querySelectorAll('.fleet-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.category === cat);
  });

  const fleetSec = document.getElementById('fleet');
  if (fleetSec) {
    fleetSec.scrollIntoView({ behavior: 'smooth' });
  }
};

window.setBookingTab = function (tab) {
  document.querySelectorAll('.bar-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(
    tab === 'chauffeur' ? 'tabChauffeur' :
    tab === 'corporate' ? 'tabCorporate' : 'tabOutstation'
  );
  if (activeBtn) activeBtn.classList.add('active');

  const heroService = document.getElementById('heroService');
  if (heroService) {
    if (tab === 'chauffeur') heroService.value = 'Corporate Car Rental';
    else if (tab === 'corporate') heroService.value = 'Employee Transport Solutions';
    else if (tab === 'outstation') heroService.value = 'Airport Transfers';
  }
};

window.handleHeroQuickBooking = function (e) {
  e.preventDefault();
  const form = document.getElementById('heroQuickBookForm');
  if (!form) return;

  const formData = new FormData(form);
  openBookingModal({
    pickup_city: formData.get('pickup_city'),
    destination: formData.get('destination'),
    pickup_date: formData.get('pickup_date'),
    service_type: formData.get('service_type')
  });
};
