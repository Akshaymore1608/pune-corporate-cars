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
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = '#070e1f';
        navLinks.style.padding = '1.5rem';
        navLinks.style.borderBottom = '1px solid var(--border-gold)';
      }
    });
  }
}

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
        <div class="fleet-card" data-category="${car.category}">
          <div class="fleet-card-img-wrap">
            <span class="fleet-badge">${car.category_label}</span>
            <img src="${car.image_url}" alt="${car.model}" class="fleet-real-img" loading="lazy" 
                 onerror="this.src='/assets/cars/mercedes-e220.jpg'">
          </div>
          <div class="fleet-card-body">
            <h3 class="fleet-card-title">${car.model}</h3>
            <div class="fleet-card-category">${car.category_label} • Pan-India Network</div>
            
            <div class="fleet-specs-row">
              <div class="spec-cell">
                <span>👥</span> <strong>${car.passengers} Passengers</strong>
              </div>
              <div class="spec-cell">
                <span>🧳</span> <strong>${car.luggage}</strong>
              </div>
            </div>

            <div class="fleet-features-tags">
              ${car.features.map(f => `<span class="feature-pill">${f}</span>`).join('')}
            </div>

            <div class="fleet-card-footer">
              <div style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 700;">
                Enquiry Based Rates
              </div>
              <button class="btn btn-primary btn-sm" onclick="selectCarForBooking(${car.id})">
                Enquire Now →
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
      <div class="pricing-card ${pkg.popular ? 'popular' : ''}">
        ${pkg.popular ? '<span class="popular-badge">Corporate Standard</span>' : ''}
        <div class="pricing-header">
          <div class="pricing-tag">${pkg.category_tag}</div>
          <h3>${pkg.title}</h3>
        </div>
        <div class="price-main">${pkg.price_display}</div>
        <div class="price-condition">${pkg.duration_km} • ${pkg.extra_km_rate}</div>

        <ul class="pricing-specs-list">
          ${pkg.inclusions.map(inc => `<li>${inc}</li>`).join('')}
        </ul>

        <button class="btn ${pkg.popular ? 'btn-primary' : 'btn-outline'}" onclick="openBookingForPackage('${pkg.title}')">
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

// 3. Load Directors (Founder & MD Sanjay Nalawade from PDF)
async function loadDirectors() {
  const container = document.getElementById('directorsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/directors');
    const json = await res.json();
    if (!json.success || !json.data.length) return;

    const director = json.data[0]; // Sanjay Nalawade
    container.innerHTML = `
      <div class="founder-profile-card">
        <div class="founder-avatar-circle">${director.avatar_initials}</div>
        <div class="founder-content">
          <h3>${director.name}</h3>
          <div class="founder-title-badge">${director.title} • Pune Corporate Cars India Pvt. Ltd.</div>
          <p class="founder-bio">${director.role_description}</p>
          <div class="founder-contact-meta">
            <a href="mailto:${director.email}" class="founder-email-link">
              ✉ ${director.email}
            </a>
            <span style="color: var(--text-dim);">|</span>
            <span style="font-size: 0.88rem; color: #cbd5e1;">📍 Base Location: Pune, Maharashtra, India</span>
            <span style="color: var(--text-dim);">|</span>
            <span style="font-size: 0.88rem; color: var(--primary-gold-light); font-weight: 600;">Pan-India Network: 100+ Major Cities</span>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Failed to load directors:', err);
  }
}

// 4. Load Pan-India Locations (Deduplicated 50+ Cities from PDF)
async function loadLocations(query = '') {
  const container = document.getElementById('locationsGrid');
  if (!container) return;

  try {
    const res = await fetch(`/api/locations${query ? `?query=${encodeURIComponent(query)}` : ''}`);
    const json = await res.json();
    if (!json.success) return;

    allLocations = json.data;

    container.innerHTML = allLocations.map(loc => `
      <div class="location-chip ${loc.is_major ? 'major' : ''}">
        <div>
          <div class="location-city">${loc.city}</div>
          <div class="location-state">${loc.state}</div>
        </div>
        ${loc.airport_code ? `<span class="airport-code-tag">${loc.airport_code}</span>` : ''}
      </div>
    `).join('');

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
      <div class="testimonial-card">
        <div style="color: var(--primary-gold-light); font-size: 1.1rem; margin-bottom: 0.75rem;">★★★★★</div>
        <div class="testimonial-quote">“${t.comment}”</div>
        <div class="testimonial-author-row">
          <div class="author-info">
            <h4>${t.author_name}</h4>
            <p>${t.designation} — ${t.company}</p>
            <div style="font-size: 0.75rem; color: var(--text-dim);">Verified Client Reference • ${t.city}</div>
          </div>
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
      <div class="blog-card">
        <div class="blog-cat-tag">${b.category}</div>
        <h3>${b.title}</h3>
        <p>${b.summary}</p>
        <div class="blog-card-meta">
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
    <div class="modal-content" style="text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
      <h2 style="color: #fff; margin-bottom: 0.5rem;">Corporate Enquiry Registered!</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
        Your requirement has been logged into our central dispatch database.
      </p>

      <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid var(--border-cyan); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Enquiry Reference Number</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-gold-light); letter-spacing: 0.05em;">${bookingRef}</div>
        <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.5rem;">
          Vehicle: <strong>${data.vehicle_name}</strong> | Service: <strong>${data.service_type}</strong>
        </div>
      </div>

      <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 1.5rem;">
        Our corporate travel team will review and share a proposal shortly. For immediate assistance, contact our 24x7 helpdesk at <strong>+91 9822943334</strong>.
      </p>

      <button class="btn btn-primary" style="width: 100%;" onclick="document.getElementById('confirmModal').classList.remove('active')">
        Close
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
