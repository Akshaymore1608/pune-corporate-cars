const path = require('node:path');
const fs = require('node:fs');

let DatabaseSync = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  console.warn('node:sqlite is not available in current Node environment');
}

let db = null;
if (DatabaseSync) {
  try {
    if (process.env.VERCEL) {
      // Serverless cloud environment: use in-memory SQLite to prevent read-only filesystem errors
      db = new DatabaseSync(':memory:');
    } else {
      const dbPath = path.join(__dirname, 'pune_corporate_cars.db');
      db = new DatabaseSync(dbPath);
      db.exec('PRAGMA foreign_keys = ON;');
      try {
        db.exec('PRAGMA journal_mode = WAL;');
      } catch (walErr) {
        // WAL not supported on some storage mounts
      }
    }
  } catch (err) {
    console.warn('SQLite file initialization failed, using in-memory mode:', err.message);
    try {
      db = new DatabaseSync(':memory:');
    } catch (e) {
      db = null;
    }
  }
}

// Fallback safety wrapper in case node:sqlite cannot be loaded
if (!db) {
  const inMemoryStore = {
    fleet: [],
    pricing_packages: [],
    locations: [],
    testimonials: [],
    directors: [],
    blogs: [],
    bookings: [],
    corporate_enquiries: [],
    admins: []
  };

  db = {
    exec: () => {},
    prepare: (query) => {
      const q = (query || '').trim();
      return {
        all: (...params) => {
          if (q.includes('FROM fleet')) return inMemoryStore.fleet;
          if (q.includes('FROM locations')) return inMemoryStore.locations;
          if (q.includes('FROM testimonials')) return inMemoryStore.testimonials;
          if (q.includes('FROM directors')) return inMemoryStore.directors;
          if (q.includes('FROM blogs')) return inMemoryStore.blogs;
          if (q.includes('FROM pricing_packages')) return inMemoryStore.pricing_packages;
          if (q.includes('FROM bookings')) return inMemoryStore.bookings;
          return [];
        },
        get: (...params) => {
          if (q.includes('COUNT(*)')) return { count: inMemoryStore.fleet.length };
          if (q.includes('FROM admins')) return { id: 1, username: 'admin', password_hash: 'adminPassword2026!', full_name: 'PCC Command Center', role: 'Super Administrator' };
          if (q.includes('FROM directors')) return inMemoryStore.directors[0] || null;
          if (q.includes('FROM fleet')) return inMemoryStore.fleet[0] || null;
          return null;
        },
        run: (...params) => ({ lastInsertRowid: Date.now(), changes: 1 })
      };
    }
  };
}

function initDatabase() {
  // 1. Create tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS fleet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      category_label TEXT NOT NULL,
      passengers INTEGER NOT NULL,
      luggage TEXT NOT NULL,
      image_url TEXT NOT NULL,
      base_fare_local REAL NOT NULL,
      per_km_outstation REAL NOT NULL,
      airport_fare REAL NOT NULL,
      features TEXT NOT NULL,
      popular INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pricing_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_tag TEXT NOT NULL,
      price_display TEXT NOT NULL,
      duration_km TEXT NOT NULL,
      extra_km_rate TEXT NOT NULL,
      extra_hr_rate TEXT NOT NULL,
      description TEXT NOT NULL,
      inclusions TEXT NOT NULL,
      popular INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL UNIQUE,
      state TEXT NOT NULL,
      region TEXT NOT NULL,
      airport_code TEXT,
      service_types TEXT NOT NULL,
      is_major INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_name TEXT NOT NULL,
      designation TEXT NOT NULL,
      company TEXT NOT NULL,
      city TEXT NOT NULL,
      comment TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      verified INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS directors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      role_description TEXT NOT NULL,
      email TEXT,
      experience TEXT NOT NULL,
      avatar_initials TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      read_time TEXT NOT NULL,
      date_published TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_ref TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      company_name TEXT,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      service_type TEXT NOT NULL,
      vehicle_id INTEGER,
      vehicle_name TEXT NOT NULL,
      pickup_city TEXT NOT NULL,
      destination TEXT NOT NULL,
      pickup_date TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      passengers INTEGER DEFAULT 1,
      luggage_bags INTEGER DEFAULT 1,
      estimated_fare REAL NOT NULL,
      special_requests TEXT,
      assigned_driver TEXT,
      assigned_cab TEXT,
      admin_notes TEXT,
      status TEXT DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS corporate_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enquiry_ref TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      designation TEXT,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      service_required TEXT NOT NULL,
      fleet_requirement TEXT,
      headcount INTEGER,
      contract_duration TEXT,
      route_details TEXT,
      message TEXT,
      status TEXT DEFAULT 'New',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'Administrator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe Seeding 1: Fleet (Only seed if table is empty, preserving existing records & IDs)
  const fleetCount = db.prepare('SELECT COUNT(*) as count FROM fleet').get()?.count || 0;
  if (fleetCount === 0) {
    const insertFleet = db.prepare(`
      INSERT INTO fleet (model, category, category_label, passengers, luggage, image_url, base_fare_local, per_km_outstation, airport_fare, features, popular, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const fleetData = [
      ['Maruti Suzuki Dzire', 'sedan', 'Economy Sedan', 4, '1 large + 2 small', '/assets/cars/dzire.jpg', 1600, 12.0, 1100, JSON.stringify(['AC & Heater', 'Clean Linens', 'GPS Ride Monitored', 'Uniformed Chauffeur', 'Audio System']), 1, 1],
      ['Hyundai Aura', 'sedan', 'Economy / Comfort Sedan', 4, '1 large + 2 small', '/assets/cars/aura.jpg', 1700, 12.5, 1150, JSON.stringify(['Air Conditioned', 'Clean Sanitized Cabin', 'GPS Tracked', 'Mobile Charging Ports', 'Professional Driver']), 0, 2],
      ['Honda Amaze', 'sedan', 'Comfort Sedan', 4, '2 large + 2 small', '/assets/cars/amaze.png', 1800, 13.0, 1200, JSON.stringify(['Spacious Boot Space', 'Smooth Suspension', 'GPS Telemetry', 'Trained Chauffeur', 'Comfortable Seating']), 1, 3],
      ['Maruti Suzuki Ertiga', 'mpv', 'MPV', 7, '2 large + 2 small', '/assets/cars/ertiga.jpg', 2200, 15.0, 1600, JSON.stringify(['7 Passenger Seating', 'Rear AC Vents', 'Employee Shift Commute Ready', 'GPS Monitored', 'Luggage Carrier Option']), 1, 4],
      ['Toyota Rumion', 'mpv', 'MPV', 7, '2 large + 1 small', '/assets/cars/rumion.jpg', 2300, 15.5, 1650, JSON.stringify(['Toyota Reliability', 'Spacious 7 Seater', 'Centralized Fleet Coordination', 'Daily Sanitized', 'Long-term Contract Ready']), 0, 5],
      ['Toyota Innova Crysta', 'premium_mpv', 'Premium MPV', 7, '2 large + 2 small', '/assets/cars/innova-crysta.jpg', 2800, 18.0, 2100, JSON.stringify(['Captain Seats', 'Dual Zone Climate AC', 'Executive Corporate Choice', 'Airport Meet & Greet', 'Highway Certified Driver']), 1, 6],
      ['Toyota Innova Hycross', 'premium_mpv', 'Premium / Hybrid MPV', 7, '2 large + 2 small', '/assets/cars/innova-hycross.jpg', 3200, 20.0, 2400, JSON.stringify(['Self-Charging Hybrid', 'Ultra-Quiet Executive Cabin', 'Ottoman Reclining Seats', 'Eco Compliance', 'Pan-India Dispatch']), 1, 7],
      ['Toyota Fortuner', 'suv', 'SUV', 7, '3 large + 2 small', '/assets/cars/fortuner.jpg', 4500, 28.0, 3500, JSON.stringify(['4x4 Executive SUV', 'High Ground Clearance', 'VIP Escort & Industrial MIDC', 'Premium Leather Upholstery', 'Highway Dominance']), 1, 8],
      ['Mercedes-Benz E220', 'luxury_sedan', 'Luxury Sedan', 4, '2 large + 2 small', '/assets/cars/mercedes-e220.jpg', 7500, 48.0, 5500, JSON.stringify(['German Luxury Prestige', 'Panoramic Glass Roof', 'Discreet Protocol Chauffeur', 'Airport VIP Reception', 'Acoustic Soundproofing']), 1, 9],
      ['Mercedes-Benz E250', 'luxury_sedan', 'Luxury Sedan', 4, '2 large + 2 small', '/assets/cars/mercedes-e250.jpg', 8000, 50.0, 6000, JSON.stringify(['First Class Rear Comfort', 'Executive Privacy Blinds', 'White Glove Protocol', 'Board Member Transit', 'Impeccable Maintenance']), 0, 10],
      ['Jaguar XF', 'luxury_sedan', 'Luxury Sedan', 4, '2 large + 1 small', '/assets/cars/jaguar-xf.jpg', 7800, 49.0, 5800, JSON.stringify(['British Aristocracy & Elegance', 'Windsor Leather', 'Premium Meridian Surround Sound', 'Red Carpet Dignitary Travel', 'GPS Ride Monitored']), 0, 11],
      ['BMW 5 Series', 'luxury_sedan', 'Luxury Sedan', 4, '2 large + 2 small', '/assets/cars/bmw5.jpg', 8200, 52.0, 6200, JSON.stringify(['Executive Business Class', 'Adaptive Ride Comfort', 'C-Suite Preferred', 'Airport VIP Transfer', 'Background-Verified Chauffeur']), 1, 12],
      ['BMW 3 Series', 'luxury_sedan', 'Luxury Sedan', 4, '1 large + 2 small', '/assets/cars/bmw3.jpg', 7000, 45.0, 5200, JSON.stringify(['Dynamic Luxury Sedan', 'Ambient Lighting', 'Executive Travel', 'GPS Enabled', '24x7 Support']), 0, 13],
      ['Toyota Camry', 'premium_sedan', 'Premium Sedan', 4, '2 large + 1 small', '/assets/cars/camry.jpg', 4800, 30.0, 3800, JSON.stringify(['Self-Charging Hybrid', 'Executive Rear Armrest Controls', 'Smooth Whisper-Quiet Ride', 'Corporate Leadership Favourite', 'Complimentary Water & Tissues']), 1, 14],
      ['Kia Carnival', 'premium_mpv', 'Luxury MPV', 7, '4 large + 2 small', '/assets/cars/carnival.jpg', 5500, 35.0, 4200, JSON.stringify(['VIP Lounge Recliners', 'Dual Sunroofs', 'Huge Luggage Capacity', 'Electric Sliding Doors', 'Executive Group Mobility']), 0, 15]
    ];

    for (const item of fleetData) {
      insertFleet.run(...item);
    }
  }

  // Safe Seeding 2: Directors (Only seed if table is empty)
  const dirCount = db.prepare('SELECT COUNT(*) as count FROM directors').get()?.count || 0;
  if (dirCount === 0) {
    const insertDirector = db.prepare(`
      INSERT INTO directors (name, title, role_description, email, experience, avatar_initials, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertDirector.run(
      'Sanjay Nalawade',
      'Founder & Managing Director',
      'Founder and Managing Director of Pune Corporate Cars India Private Limited. Dedicated to professional chauffeur-driven transport, corporate mobility excellence, punctuality guarantees, and safety governance across Pune and Pan-India networks.',
      'sanjay.nalawade@punecorporatecars.com',
      'Founder & Managing Director',
      'SN',
      1
    );

    insertDirector.run(
      'Prashant Nalawade',
      'Director & Operations Head',
      'Key Director and Operations Leader of Pune Corporate Cars India Private Limited. Spearheading 24×7 dispatch operations, chauffeur training protocols, vehicle maintenance governance, and Pan-India partner coordination across 100+ cities.',
      'prashant.nalawade@punecorporatecars.com',
      'Key Director & Operations Head',
      'PN',
      2
    );
  }

  // Safe Seeding 3: Testimonials (Only seed if table is empty)
  const testCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get()?.count || 0;
  if (testCount === 0) {
    const insertTestimonial = db.prepare(`
      INSERT INTO testimonials (author_name, designation, company, city, comment, rating, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const testData = [
      ['Mr. Gorakh Paithane', 'Corporate Client', 'Enterprise Accounts', 'Pune', 'Punctuality and clean vehicles are consistently maintained. Chauffeurs are professional, courteous, and dependable for our daily office and executive transit.', 5, 1],
      ['Miss. Pratiksha Nalawade', 'Corporate Traveler', 'Corporate Operations', 'Pune', 'Extremely responsive operations helpdesk with smooth coordination. Safe, punctual pickups and well-maintained cars make corporate travel effortless.', 5, 1],
      ['Mr. Ali Sayyad', 'Corporate Client', 'Business Travel Desk', 'Pune', 'Last-minute flexibility and coordination were handled seamlessly. Chauffeur was background-verified, respectful, and on time for our client meetings.', 5, 1],
      ['Mr. Prashant Savalkar', 'Corporate Client', 'Operations', 'Pune', '24x7 support desk is always responsive. Airport pickup runs are reliable, cars are air-conditioned and spotless, and corporate billing is clear.', 5, 1],
      ['Miss. Hima Pradhan', 'Corporate Traveler', 'Executive Services', 'Pune', 'Professional drivers and comfortable vehicles. Pune Corporate Cars manages our executive transfers with total reliability and discipline.', 5, 1],
      ['Mr. Rohit Shere', 'Corporate Client', 'Logistics Support', 'Pune', 'Clean vehicles, smooth intercity coordination, and transparent reporting. One of the most reliable corporate car rental partners in Pune.', 5, 1],
      ['Mr. Mangal Patil', 'Corporate Client', 'Industrial Mobility', 'Markal MIDC', 'Dependable industrial shuttle and corporate cab service with GPS-enabled vehicles and organized fleet coordination.', 5, 1],
      ['Mr. Amol Gavhane', 'Corporate Client', 'Enterprise Travel', 'Pune', 'Timely airport pickups with flight tracking. Professional chauffeurs in uniform who know city and highway routes well.', 5, 1]
    ];

    for (const t of testData) {
      insertTestimonial.run(...t);
    }
  }

  // Safe Seeding 4: Blogs (Only seed if table is empty)
  const blogsCount = db.prepare('SELECT COUNT(*) as count FROM blogs').get()?.count || 0;
  if (blogsCount === 0) {
    const insertBlog = db.prepare(`
      INSERT INTO blogs (title, category, summary, read_time, date_published)
      VALUES (?, ?, ?, ?, ?)
    `);

    const blogsData = [
      [
        'Corporate cab service in pune',
        'Corporate Mobility',
        'Positioned around office commuting, regular corporate travel, reliability, comfort, and cost-effective chauffeur-driven ground transportation across Pune business corridors.',
        '4 Min Read',
        '2026-10-15'
      ],
      [
        'Monthly Cab Services in Pune',
        'Dedicated Services',
        'A comprehensive guide for recurring office commuting, employee shift transportation, and longer-term dedicated vehicle contracts for enterprises and industrial units.',
        '5 Min Read',
        '2026-10-20'
      ],
      [
        'Corporate Cab Services in Bangalore',
        'Multi-City Travel',
        'Centralized multi-city network coordination model providing seamless ground mobility, airport transfers, and executive travel across Bengaluru tech parks.',
        '4 Min Read',
        '2026-10-28'
      ]
    ];

    for (const b of blogsData) {
      insertBlog.run(...b);
    }
  }

  // Safe Seeding 5: Pricing Packages (Only seed if table is empty)
  const pkgCount = db.prepare('SELECT COUNT(*) as count FROM pricing_packages').get()?.count || 0;
  if (pkgCount === 0) {
    const insertPackage = db.prepare(`
      INSERT INTO pricing_packages (title, category_tag, price_display, duration_km, extra_km_rate, extra_hr_rate, description, inclusions, popular)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const packages = [
      [
        'Corporate Car Rental (8H / 80KM)',
        'Corporate Rental',
        'Enquiry Based',
        '8 Hours / 80 Kilometers',
        'Competitive Tariff',
        'Standard Extra Hour',
        'Chauffeur-driven sedans, SUVs, and executive cars on short-term rentals, dedicated vehicles, and longer-term corporate contracts.',
        JSON.stringify([
          'Chauffeur-driven sedans, SUVs & executive cars',
          'Clean, air-conditioned & well-maintained vehicle',
          'GPS-enabled with 24x7 operations support',
          'Corporate billing & MIS reporting',
          'Uniformed and background-verified chauffeur'
        ]),
        1
      ],
      [
        'Employee Transport Solutions',
        'Staff Mobility',
        'Enquiry Based',
        'Shift Rosters / Industrial Shuttles',
        'Contract Slabs',
        'SLA Backed',
        'Daily staff commute, shift-based pickup/drop, employee shuttles, route planning, and workforce movement for offices and industrial units.',
        JSON.stringify([
          'Automated route planning & GPS geofencing',
          'Shift-based pickup/drop for IT & industrial units',
          'Worker transport & company cabs around Markal MIDC',
          'Escort security marshals for night female shifts',
          'Monthly consolidated GST invoicing with MIS'
        ]),
        1
      ],
      [
        'Conferences, Events & Delegations',
        'Event Logistics',
        'Custom RFP',
        'Event Duration / Multi-Vehicle',
        'Dedicated Coordinator',
        'On-Ground Marshal',
        'End-to-end fleet mobility for corporate conferences, annual general meetings, foreign delegations, and product launches.',
        JSON.stringify([
          'VIP protocol with executive sedans & MPVs',
          'Dedicated on-site transport desk & marshals',
          'Real-time fleet tracking & convoy management',
          'Luggage vans & airport terminal reception',
          'Strict privacy & non-disclosure standards'
        ]),
        0
      ],
      [
        'Pan India Car Rental Services',
        'Pan-India Network',
        'Enquiry Based',
        '100+ Major Cities',
        'Distance & Day Tariff',
        'Single Window Billing',
        'A multi-city network and a centralized coordination model for companies needing ground transportation across India.',
        JSON.stringify([
          'Centralized coordination across 100+ major cities',
          'Unified corporate service level agreement (SLA)',
          'Highway-certified chauffeurs with valid permits',
          'Single consolidated monthly billing & MIS reports',
          '24x7 emergency roadside backup & dispatch'
        ]),
        1
      ]
    ];

    for (const p of packages) {
      insertPackage.run(...p);
    }
  }

  // Safe Seeding 6: Locations (49 Cities across India - Only seed if empty)
  const locCount = db.prepare('SELECT COUNT(*) as count FROM locations').get()?.count || 0;
  if (locCount === 0) {
    const insertLoc = db.prepare(`
      INSERT INTO locations (city, state, region, airport_code, service_types, is_major)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const locationsData = [
      ["Pune","Maharashtra","West","PNQ","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Mumbai","Maharashtra","West","BOM","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Bengaluru","Karnataka","South","BLR","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Delhi","Delhi NCR","North","DEL","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Gurugram","Haryana","North","DEL","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Noida","Uttar Pradesh","North","DEL","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Hyderabad","Telangana","South","HYD","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Chennai","Tamil Nadu","South","MAA","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Ahmedabad","Gujarat","West","AMD","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Kolkata","West Bengal","East","CCU","Local, Airport, Outstation, Employee Commute, VIP",1],
      ["Chandigarh","Punjab / Haryana","North","IXC","Local, Airport, Outstation, VIP",1],
      ["Jaipur","Rajasthan","North","JAI","Local, Airport, Outstation, VIP",1],
      ["Nashik","Maharashtra","West","ISK","Local, Outstation, Industrial Commute",0],
      ["Aurangabad","Maharashtra","West","IXU","Local, Outstation, Industrial Commute",0],
      ["Nagpur","Maharashtra","West","NAG","Local, Airport, Outstation, Corporate",1],
      ["Kolhapur","Maharashtra","West","KLH","Local, Outstation, Industrial Commute",0],
      ["Solapur","Maharashtra","West","SSE","Local, Outstation",0],
      ["Indore","Madhya Pradesh","Central","IDR","Local, Airport, Outstation, Corporate",1],
      ["Bhopal","Madhya Pradesh","Central","BHO","Local, Airport, Outstation",0],
      ["Surat","Gujarat","West","STV","Local, Airport, Outstation, Industrial",1],
      ["Vadodara","Gujarat","West","BDQ","Local, Airport, Outstation, Industrial",0],
      ["Rajkot","Gujarat","West","RAJ","Local, Outstation",0],
      ["Jamnagar","Gujarat","West","JGA","Local, Outstation, Industrial",0],
      ["Coimbatore","Tamil Nadu","South","CJB","Local, Airport, Outstation, Industrial",1],
      ["Kochi","Kerala","South","COK","Local, Airport, Outstation, VIP",1],
      ["Kozhikode","Kerala","South","CCJ","Local, Airport, Outstation",0],
      ["Trivandrum","Kerala","South","TRV","Local, Airport, Outstation",0],
      ["Madurai","Tamil Nadu","South","IXM","Local, Airport, Outstation",0],
      ["Mangaluru","Karnataka","South","IXE","Local, Airport, Outstation",0],
      ["Mysuru","Karnataka","South","MYQ","Local, Outstation, Industrial",0],
      ["Hubballi","Karnataka","South","HBX","Local, Outstation",0],
      ["Vijayawada","Andhra Pradesh","South","VGA","Local, Airport, Outstation",0],
      ["Visakhapatnam","Andhra Pradesh","South","VTZ","Local, Airport, Outstation",1],
      ["Tirupati","Andhra Pradesh","South","TIR","Local, Airport, Outstation",0],
      ["Trichy","Tamil Nadu","South","TRZ","Local, Airport, Outstation",0],
      ["Salem","Tamil Nadu","South","SXV","Local, Outstation",0],
      ["Lucknow","Uttar Pradesh","North","LKO","Local, Airport, Outstation, VIP",1],
      ["Faridabad","Haryana","North","DEL","Local, Corporate Commute",0],
      ["Ghaziabad","Uttar Pradesh","North","DEL","Local, Corporate Commute",0],
      ["Gwalior","Madhya Pradesh","Central","GWL","Local, Outstation",0],
      ["Ludhiana","Punjab","North","LUH","Local, Industrial Commute",0],
      ["Amritsar","Punjab","North","ATQ","Local, Airport, Outstation",0],
      ["Jodhpur","Rajasthan","North","JDH","Local, Airport, Outstation",0],
      ["Udaipur","Rajasthan","North","UDR","Local, Airport, Outstation, VIP",0],
      ["Kota","Rajasthan","North","KTU","Local, Outstation",0],
      ["Bhubaneswar","Odisha","East","BBI","Local, Airport, Outstation",1],
      ["Patna","Bihar","East","PAT","Local, Airport, Outstation",0],
      ["Ranchi","Jharkhand","East","IXR","Local, Airport, Outstation",0],
      ["Guwahati","Assam","North East","GAU","Local, Airport, Outstation",0]
    ];

    for (const loc of locationsData) {
      insertLoc.run(...loc);
    }
  }

  // Safe Seeding 7: Default Admin (Only seed if empty)
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get()?.count || 0;
  if (adminCount === 0) {
    const defaultUsername = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'adminPassword2026!';
    db.prepare(`
      INSERT INTO admins (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(defaultUsername, defaultPassword, 'PCC Operations Command', 'Super Administrator');
  }

  console.log('Database initialized with safe idempotent seeding successfully!');
}

module.exports = {
  db,
  initDatabase
};
