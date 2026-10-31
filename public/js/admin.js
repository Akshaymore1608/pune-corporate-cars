/**
 * Pune Corporate Cars - Admin Operations Command Center Logic
 */

let adminToken = localStorage.getItem('pcc_admin_token') || 'demo-admin-token-2026';
let currentTab = 'bookings';
let currentBookings = [];
let currentEnquiries = [];
let activeEditBookingId = null;

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  setupNavigation();
  setupSearchAndFilters();
});

// Auth Handlers
function initAdminAuth() {
  const loginWrapper = document.getElementById('loginWrapper');
  const loginForm = document.getElementById('adminLoginForm');
  const demoLoginBtn = document.getElementById('demoLoginBtn');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  // If already logged in, show dashboard
  if (adminToken) {
    if (loginWrapper) loginWrapper.style.display = 'none';
    loadAdminDashboard();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          adminToken = data.token;
          localStorage.setItem('pcc_admin_token', adminToken);
          loginWrapper.style.display = 'none';
          loadAdminDashboard();
        } else {
          alert(data.error || 'Invalid credentials');
        }
      } catch (err) {
        alert('Authentication failed');
      }
    });
  }

  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', () => {
      adminToken = 'demo-admin-token-2026';
      localStorage.setItem('pcc_admin_token', adminToken);
      if (loginWrapper) loginWrapper.style.display = 'none';
      loadAdminDashboard();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('pcc_admin_token');
      adminToken = null;
      window.location.reload();
    });
  }
}

// Navigation between Bookings & Enquiries tabs
function setupNavigation() {
  const navBookings = document.getElementById('navBookings');
  const navEnquiries = document.getElementById('navEnquiries');
  const secBookings = document.getElementById('secBookings');
  const secEnquiries = document.getElementById('secEnquiries');

  if (navBookings) {
    navBookings.addEventListener('click', () => {
      navBookings.classList.add('active');
      navEnquiries.classList.remove('active');
      secBookings.style.display = 'block';
      secEnquiries.style.display = 'none';
      currentTab = 'bookings';
      loadBookings();
    });
  }

  if (navEnquiries) {
    navEnquiries.addEventListener('click', () => {
      navEnquiries.classList.add('active');
      navBookings.classList.remove('active');
      secBookings.style.display = 'none';
      secEnquiries.style.display = 'block';
      currentTab = 'enquiries';
      loadEnquiries();
    });
  }
}

// Setup search input and status dropdown
function setupSearchAndFilters() {
  const searchInput = document.getElementById('adminSearchInput');
  const statusFilter = document.getElementById('adminStatusFilter');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (currentTab === 'bookings') loadBookings();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      if (currentTab === 'bookings') loadBookings();
    });
  }
}

// Main loader
async function loadAdminDashboard() {
  loadStats();
  loadBookings();
}

// Load KPI Stats
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!json.success) return;

    const s = json.stats;
    document.getElementById('statTotalBookings').innerText = s.totalBookings;
    document.getElementById('statNewBookings').innerText = s.newBookings;
    document.getElementById('statEnquiries').innerText = s.totalEnquiries;
    document.getElementById('statRevenue').innerText = `₹${s.estimatedRevenue.toLocaleString('en-IN')}`;
    document.getElementById('statFleet').innerText = s.fleetCount;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Load Bookings Table
async function loadBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  const search = document.getElementById('adminSearchInput')?.value || '';
  const status = document.getElementById('adminStatusFilter')?.value || 'all';

  if (!tbody) return;

  try {
    const res = await fetch(`/api/admin/bookings?status=${status}&search=${encodeURIComponent(search)}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!json.success) return;

    currentBookings = json.data;

    if (currentBookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #94a3b8;">No bookings match filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentBookings.map(b => `
      <tr>
        <td>
          <strong style="color: var(--admin-gold);">${b.booking_ref}</strong>
          <div style="font-size: 0.72rem; color: #94a3b8;">${b.created_at || ''}</div>
        </td>
        <td>
          <strong>${b.customer_name}</strong>
          <div style="font-size: 0.78rem; color: #94a3b8;">${b.company_name || 'Individual'}</div>
          <div style="font-size: 0.75rem; color: var(--admin-cyan);">${b.phone}</div>
        </td>
        <td>
          <div>${b.service_type}</div>
          <div style="font-size: 0.78rem; color: var(--admin-gold);">${b.vehicle_name}</div>
        </td>
        <td>
          <div>${b.pickup_city} → ${b.destination}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">📅 ${b.pickup_date} at ${b.pickup_time}</div>
        </td>
        <td>
          <strong>₹${Number(b.estimated_fare).toLocaleString('en-IN')}</strong>
        </td>
        <td>
          <span class="status-pill status-${b.status.toLowerCase()}">${b.status}</span>
        </td>
        <td>
          <div style="font-size: 0.78rem;">🚗 ${b.assigned_cab || 'Unassigned'}</div>
          <div style="font-size: 0.78rem; color: #94a3b8;">👤 ${b.assigned_driver || 'Pending'}</div>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="openEditBookingModal(${b.id})">
            Manage / Dispatch
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load bookings:', err);
  }
}

// Load Corporate Enquiries Table
async function loadEnquiries() {
  const tbody = document.getElementById('enquiriesTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/enquiries', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!json.success) return;

    currentEnquiries = json.data;

    if (currentEnquiries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">No corporate RFQs found.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentEnquiries.map(e => `
      <tr>
        <td>
          <strong style="color: var(--admin-cyan);">${e.enquiry_ref}</strong>
          <div style="font-size: 0.72rem; color: #94a3b8;">${e.created_at || ''}</div>
        </td>
        <td>
          <strong>${e.company_name}</strong>
          <div style="font-size: 0.78rem; color: #cbd5e1;">Contact: ${e.contact_person} (${e.designation || 'Lead'})</div>
          <div style="font-size: 0.75rem; color: var(--admin-gold);">${e.phone} | ${e.email}</div>
        </td>
        <td>
          <div><strong>${e.service_required}</strong></div>
          <div style="font-size: 0.78rem; color: #94a3b8;">Fleet: ${e.fleet_requirement || 'General'}</div>
        </td>
        <td>
          <div>${e.headcount ? `${e.headcount} Employees` : 'N/A'}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">${e.contract_duration || 'Flexible'}</div>
        </td>
        <td>
          <div style="font-size: 0.78rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${e.message || ''}">
            ${e.route_details ? `📍 Route: ${e.route_details} | ` : ''}${e.message || 'No additional notes'}
          </div>
        </td>
        <td>
          <span class="status-pill status-${e.status.toLowerCase().replace(/\s+/g, '-')}">${e.status}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="promptUpdateEnquiry(${e.id}, '${e.status}')">
            Update Status
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load enquiries:', err);
  }
}

// Edit Booking Modal
window.openEditBookingModal = function (bookingId) {
  const b = currentBookings.find(item => item.id === bookingId);
  if (!b) return;

  activeEditBookingId = bookingId;
  document.getElementById('editModalRef').innerText = b.booking_ref;
  document.getElementById('editModalCustomer').innerText = `${b.customer_name} (${b.company_name || 'Individual'})`;
  document.getElementById('editModalStatus').value = b.status;
  document.getElementById('editModalDriver').value = b.assigned_driver === 'Assigned upon dispatch confirmation' ? '' : (b.assigned_driver || '');
  document.getElementById('editModalCab').value = b.assigned_cab === 'Assigned upon dispatch confirmation' ? '' : (b.assigned_cab || '');
  document.getElementById('editModalNotes').value = b.admin_notes || '';

  document.getElementById('editBookingModal').classList.add('active');
};

window.closeEditBookingModal = function () {
  document.getElementById('editBookingModal').classList.remove('active');
  activeEditBookingId = null;
};

// Save updated booking
window.saveBookingChanges = async function () {
  if (!activeEditBookingId) return;

  const status = document.getElementById('editModalStatus').value;
  const driver = document.getElementById('editModalDriver').value;
  const cab = document.getElementById('editModalCab').value;
  const notes = document.getElementById('editModalNotes').value;

  try {
    const res = await fetch(`/api/admin/bookings/${activeEditBookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status,
        assigned_driver: driver || 'Pending',
        assigned_cab: cab || 'Pending',
        admin_notes: notes
      })
    });

    const json = await res.json();
    if (json.success) {
      closeEditBookingModal();
      loadStats();
      loadBookings();
    } else {
      alert(json.error || 'Failed to update booking');
    }
  } catch (err) {
    alert('Error updating booking');
  }
};

// Update Enquiry status
window.promptUpdateEnquiry = async function (id, currentStatus) {
  const newStatus = prompt('Enter new status (New, Proposal Sent, Agreement Signed, Closed):', currentStatus);
  if (!newStatus || newStatus === currentStatus) return;

  try {
    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      loadStats();
      loadEnquiries();
    }
  } catch (err) {
    alert('Failed to update enquiry');
  }
};

// Export to CSV
window.exportData = function (type) {
  window.open(`/api/admin/export/${type}?token=${adminToken}`, '_blank');
};

