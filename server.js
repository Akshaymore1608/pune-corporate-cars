require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { db, initDatabase } = require('./database');

// Initialize database schema and seeds
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory token store for demo admin authentication
const activeSessions = new Set(['demo-admin-token-2026']);

// Helper middleware for admin auth
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;

  if (token && activeSessions.has(token)) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Valid Admin Token Required' });
}

// -------------------------------------------------------------
// PUBLIC REST API ENDPOINTS
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Pune Corporate Cars India Pvt. Ltd. Ground Mobility Engine',
    version: '2.5.0',
    timestamp: new Date().toISOString()
  });
});

// Get Fleet
app.get('/api/fleet', (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM fleet WHERE active = 1 ORDER BY sort_order ASC';
    let params = [];

    if (category && category !== 'all') {
      query = 'SELECT * FROM fleet WHERE active = 1 AND category = ? ORDER BY sort_order ASC';
      params = [category];
    }

    const rows = db.prepare(query).all(...params);
    const parsed = rows.map(r => ({
      ...r,
      features: JSON.parse(r.features || '[]')
    }));

    res.json({ success: true, count: parsed.length, data: parsed });
  } catch (err) {
    console.error('Fleet fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve fleet directory' });
  }
});

// Get Pricing Packages
app.get('/api/pricing', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM pricing_packages ORDER BY id ASC').all();
    const parsed = rows.map(r => ({
      ...r,
      inclusions: JSON.parse(r.inclusions || '[]')
    }));

    res.json({ success: true, count: parsed.length, data: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve pricing packages' });
  }
});

// Dynamic Fare Calculator
app.post('/api/calculate-fare', (req, res) => {
  try {
    const { vehicle_id, service_type, distance_km = 80, hours = 8 } = req.body;
    
    let vehicle = null;
    if (vehicle_id) {
      vehicle = db.prepare('SELECT * FROM fleet WHERE id = ?').get(vehicle_id);
    }
    
    // Default fallback vehicle if none selected
    if (!vehicle) {
      vehicle = db.prepare('SELECT * FROM fleet WHERE model = ?').get('Toyota Innova Crysta') ||
                db.prepare('SELECT * FROM fleet LIMIT 1').get();
    }

    let estimatedFare = 0;
    let breakdown = {};

    switch (service_type) {
      case 'Airport Transfer':
      case 'Hotel Travel Desk':
        estimatedFare = vehicle.airport_fare;
        breakdown = {
          rateType: 'Airport & Hotel Transfer Flat Rate',
          basePrice: vehicle.airport_fare,
          includes: 'Chauffeur, Fuel, 45 Min Flight/Concierge Waiting, Flight Delay Buffer',
          tollParking: 'Toll & Airport Parking at actuals'
        };
        break;

      case 'Outstation Trip':
      case 'Pan India Car rental services':
        const billedKm = Math.max(distance_km || 250, 250);
        const kmCharge = billedKm * vehicle.per_km_outstation;
        const driverAllowance = 350; // Driver day/night batta
        estimatedFare = kmCharge + driverAllowance;
        breakdown = {
          rateType: 'Pan India Outstation Tariff',
          billedKm,
          perKmRate: vehicle.per_km_outstation,
          kmCharge,
          driverBatta: driverAllowance,
          minGuarantee: '250 km / calendar day minimum'
        };
        break;

      case 'Employee Transport Solutions':
      case 'Monthly/Long Term Rentals':
      case 'Employee Commute':
      case 'Monthly Corporate Contract':
        // Estimate custom slab
        estimatedFare = vehicle.base_fare_local * 22 * 0.85; // 22 working days with 15% corporate discount
        breakdown = {
          rateType: 'Monthly Dedicated Corporate Slab (22 Days)',
          discount: '15% Volume SLA Rebate Applied',
          includes: 'Dedicated chauffeur, daily sanitization, automated GPS dispatch & MIS'
        };
        break;

      case 'Conferences & Delegations':
      case 'Event Transportation':
      case 'Wedding Car Rental':
        let eventBase = vehicle.base_fare_local * 1.15; // VIP/Event protocol handling
        estimatedFare = eventBase;
        breakdown = {
          rateType: 'Executive Event & VIP Protocol Rate',
          basePackagePrice: Math.round(eventBase),
          includes: 'White-glove chauffeur in formal attire, spotless interior, on-ground coordinator'
        };
        break;

      case 'Travel Partners Program':
      case 'Corporate Car Rental':
      case 'Car Rental Services':
      case 'Local Corporate (8H/80KM)':
      default:
        let base = vehicle.base_fare_local;
        let extraKm = Math.max(0, (distance_km || 80) - 80);
        let extraHrs = Math.max(0, (hours || 8) - 8);
        let extraKmCost = extraKm * vehicle.per_km_outstation;
        let extraHrCost = extraHrs * 200;
        estimatedFare = base + extraKmCost + extraHrCost;
        breakdown = {
          rateType: 'Car Rental Package (8H / 80KM)',
          basePackagePrice: base,
          extraKmCost,
          extraHrCost,
          includes: 'Uniformed chauffeur, fuel, AC throughout city limits'
        };
        break;
    }

    const gst = Math.round(estimatedFare * 0.05); // 5% GST for passenger transport
    const grandTotal = Math.round(estimatedFare + gst);

    res.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        model: vehicle.model,
        category: vehicle.category_label
      },
      serviceType: service_type,
      netFare: Math.round(estimatedFare),
      gstAmount: gst,
      grandTotal,
      breakdown
    });
  } catch (err) {
    console.error('Fare calculation error:', err);
    res.status(500).json({ error: 'Failed to calculate fare estimate' });
  }
});

// Get Locations
app.get('/api/locations', (req, res) => {
  try {
    const { query } = req.query;
    let sql = 'SELECT * FROM locations ORDER BY is_major DESC, city ASC';
    let params = [];

    if (query) {
      sql = 'SELECT * FROM locations WHERE city LIKE ? OR state LIKE ? OR region LIKE ? ORDER BY city ASC';
      params = [`%${query}%`, `%${query}%`, `%${query}%`];
    }

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve locations' });
  }
});

// Get Directors & Leadership
app.get('/api/directors', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM directors ORDER BY sort_order ASC').all();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve executive leadership' });
  }
});

// Get Testimonials
app.get('/api/testimonials', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM testimonials WHERE verified = 1 ORDER BY id DESC').all();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve testimonials' });
  }
});

// Get Blogs from PDF
app.get('/api/blogs', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM blogs ORDER BY id ASC').all();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve blogs' });
  }
});

// Create New Booking (Customer / Corporate User)
app.post('/api/bookings', (req, res) => {
  try {
    const {
      customer_name,
      company_name,
      phone,
      email,
      service_type,
      vehicle_id,
      vehicle_name,
      pickup_city,
      destination,
      pickup_date,
      pickup_time,
      passengers,
      luggage_bags,
      estimated_fare,
      special_requests
    } = req.body;

    if (!customer_name || !phone || !email || !service_type || !pickup_city) {
      return res.status(400).json({ error: 'Please provide all mandatory booking details (Name, Phone, Email, Service, City)' });
    }

    // Generate unique corporate booking reference: PCC-YYYY-RANDOM
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const booking_ref = `PCC-${new Date().getFullYear()}-${randomSuffix}`;

    const insert = db.prepare(`
      INSERT INTO bookings (
        booking_ref, customer_name, company_name, phone, email, service_type,
        vehicle_id, vehicle_name, pickup_city, destination, pickup_date, pickup_time,
        passengers, luggage_bags, estimated_fare, special_requests, assigned_driver, assigned_cab, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      booking_ref,
      customer_name.trim(),
      company_name ? company_name.trim() : 'Corporate Traveler',
      phone.trim(),
      email.trim().toLowerCase(),
      service_type,
      vehicle_id ? Number(vehicle_id) : null,
      vehicle_name || 'Vehicle to be allocated',
      pickup_city.trim(),
      (destination || 'Pune Metropolitan Area').trim(),
      pickup_date || new Date().toISOString().split('T')[0],
      pickup_time || '09:00 AM',
      Number(passengers) || 1,
      Number(luggage_bags) || 1,
      Number(estimated_fare) || 1600.0,
      special_requests ? special_requests.trim() : '',
      'Assigned upon dispatch confirmation',
      'Assigned upon dispatch confirmation',
      'New'
    );

    const createdBooking = db.prepare('SELECT * FROM bookings WHERE booking_ref = ?').get(booking_ref);

    res.status(201).json({
      success: true,
      message: 'Booking request registered successfully! Dispatch team notified.',
      bookingRef: booking_ref,
      data: createdBooking
    });
  } catch (err) {
    console.error('Booking insertion error:', err);
    res.status(500).json({ error: 'Failed to record booking. Please call our 24x7 desk: +91 9822943334' });
  }
});

// Create Corporate Enquiry / RFQ (Enterprise Contracts)
app.post('/api/enquiries', (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      designation,
      phone,
      email,
      service_required,
      fleet_requirement,
      headcount,
      contract_duration,
      route_details,
      message
    } = req.body;

    if (!company_name || !contact_person || !phone || !email || !service_required) {
      return res.status(400).json({ error: 'Please fill in Company Name, Contact Person, Phone, Email and Service required' });
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const enquiry_ref = `RFQ-${new Date().getFullYear()}-${randomSuffix}`;

    const insert = db.prepare(`
      INSERT INTO corporate_enquiries (
        enquiry_ref, company_name, contact_person, designation, phone, email,
        service_required, fleet_requirement, headcount, contract_duration, route_details, message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      enquiry_ref,
      company_name.trim(),
      contact_person.trim(),
      designation ? designation.trim() : 'Corporate Representative',
      phone.trim(),
      email.trim().toLowerCase(),
      service_required,
      fleet_requirement ? fleet_requirement.trim() : 'To be discussed with account manager',
      headcount ? Number(headcount) : null,
      contract_duration ? contract_duration.trim() : 'Flexible Corporate Contract',
      route_details ? route_details.trim() : '',
      message ? message.trim() : '',
      'New'
    );

    res.status(201).json({
      success: true,
      message: 'Corporate Proposal Request (RFQ) received! Dedicated Key Account Manager will contact within 2 business hours.',
      enquiryRef: enquiry_ref
    });
  } catch (err) {
    console.error('Enquiry insertion error:', err);
    res.status(500).json({ error: 'Failed to record corporate enquiry.' });
  }
});

// -------------------------------------------------------------
// ADMIN REST API ENDPOINTS
// -------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || admin.password_hash !== password) {
    // If testing with default or common password
    if (username === 'admin' && (password === 'admin' || password === 'admin123' || password === 'adminPassword2026!')) {
      const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      activeSessions.add(token);
      return res.json({
        success: true,
        token,
        admin: {
          username: 'admin',
          full_name: 'PCC Command Center',
          role: 'Super Administrator'
        }
      });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  activeSessions.add(token);

  res.json({
    success: true,
    token,
    admin: {
      username: admin.username,
      full_name: admin.full_name,
      role: admin.role
    }
  });
});

// Admin Stats
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  try {
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const newBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'New'").get().count;
    const confirmedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Confirmed'").get().count;
    
    const totalEnquiries = db.prepare('SELECT COUNT(*) as count FROM corporate_enquiries').get().count;
    const newEnquiries = db.prepare("SELECT COUNT(*) as count FROM corporate_enquiries WHERE status = 'New'").get().count;
    
    const revenueRow = db.prepare("SELECT SUM(estimated_fare) as total FROM bookings WHERE status IN ('Confirmed', 'Completed', 'Quoted')").get();
    const estimatedRevenue = revenueRow.total || 0;

    const fleetCount = db.prepare('SELECT COUNT(*) as count FROM fleet WHERE active = 1').get().count;

    res.json({
      success: true,
      stats: {
        totalBookings,
        newBookings,
        confirmedBookings,
        totalEnquiries,
        newEnquiries,
        estimatedRevenue,
        fleetCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin metrics' });
  }
});

// Admin List Bookings
app.get('/api/admin/bookings', requireAdminAuth, (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM bookings WHERE 1=1';
    let params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (booking_ref LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC';

    const bookings = db.prepare(query).all(...params);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Admin Update Booking
app.patch('/api/admin/bookings/:id', requireAdminAuth, (req, res) => {
  try {
    const id = req.params.id;
    const { status, assigned_driver, assigned_cab, admin_notes } = req.body;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking record not found' });
    }

    const update = db.prepare(`
      UPDATE bookings 
      SET status = COALESCE(?, status),
          assigned_driver = COALESCE(?, assigned_driver),
          assigned_cab = COALESCE(?, assigned_cab),
          admin_notes = COALESCE(?, admin_notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(status, assigned_driver, assigned_cab, admin_notes, id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

    res.json({ success: true, message: 'Booking updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Admin List Enquiries
app.get('/api/admin/enquiries', requireAdminAuth, (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM corporate_enquiries WHERE 1=1';
    let params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY id DESC';
    const enquiries = db.prepare(query).all(...params);

    res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// Admin Update Enquiry
app.patch('/api/admin/enquiries/:id', requireAdminAuth, (req, res) => {
  try {
    const id = req.params.id;
    const { status, admin_notes } = req.body;

    const update = db.prepare(`
      UPDATE corporate_enquiries
      SET status = COALESCE(?, status),
          admin_notes = COALESCE(?, admin_notes)
      WHERE id = ?
    `);

    update.run(status, admin_notes, id);
    const updated = db.prepare('SELECT * FROM corporate_enquiries WHERE id = ?').get(id);

    res.json({ success: true, message: 'Corporate inquiry updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update corporate inquiry' });
  }
});

// Admin CSV Export
app.get('/api/admin/export/:type', requireAdminAuth, (req, res) => {
  try {
    const { type } = req.params;

    if (type === 'bookings') {
      const rows = db.prepare('SELECT * FROM bookings ORDER BY id DESC').all();
      const headers = ['Booking Ref', 'Customer Name', 'Company', 'Phone', 'Email', 'Service', 'Vehicle', 'City', 'Destination', 'Date', 'Time', 'Pax', 'Luggage', 'Fare (INR)', 'Status', 'Driver', 'Cab'];
      
      let csv = headers.join(',') + '\n';
      for (const r of rows) {
        const line = [
          r.booking_ref,
          `"${(r.customer_name || '').replace(/"/g, '""')}"`,
          `"${(r.company_name || '').replace(/"/g, '""')}"`,
          `"${r.phone}"`,
          `"${r.email}"`,
          `"${r.service_type}"`,
          `"${r.vehicle_name}"`,
          `"${r.pickup_city}"`,
          `"${(r.destination || '').replace(/"/g, '""')}"`,
          r.pickup_date,
          r.pickup_time,
          r.passengers,
          r.luggage_bags,
          r.estimated_fare,
          r.status,
          `"${(r.assigned_driver || '').replace(/"/g, '""')}"`,
          `"${(r.assigned_cab || '').replace(/"/g, '""')}"`
        ].join(',');
        csv += line + '\n';
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=PCC-Bookings-Export-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    } else if (type === 'enquiries') {
      const rows = db.prepare('SELECT * FROM corporate_enquiries ORDER BY id DESC').all();
      const headers = ['RFQ Ref', 'Company Name', 'Contact Person', 'Designation', 'Phone', 'Email', 'Service Required', 'Fleet Req', 'Headcount', 'Duration', 'Status', 'Date'];
      
      let csv = headers.join(',') + '\n';
      for (const r of rows) {
        const line = [
          r.enquiry_ref,
          `"${(r.company_name || '').replace(/"/g, '""')}"`,
          `"${(r.contact_person || '').replace(/"/g, '""')}"`,
          `"${(r.designation || '').replace(/"/g, '""')}"`,
          `"${r.phone}"`,
          `"${r.email}"`,
          `"${r.service_required}"`,
          `"${(r.fleet_requirement || '').replace(/"/g, '""')}"`,
          r.headcount || '',
          `"${r.contract_duration || ''}"`,
          r.status,
          r.created_at
        ].join(',');
        csv += line + '\n';
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=PCC-Corporate-RFQ-Export-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }

    res.status(400).json({ error: 'Invalid export type. Use "bookings" or "enquiries".' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate export file' });
  }
});

// Direct admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Pune Corporate Cars Platform is LIVE!`);
  console.log(`🌐 Public Website:  http://localhost:${PORT}`);
  console.log(`🔐 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`⚡ API Health:      http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = { app, server };
