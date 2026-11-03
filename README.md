# Pune Corporate Cars India Private Limited
## Enterprise Ground Mobility & Corporate Fleet Platform

A production-ready, full-stack enterprise web application and dispatch management system engineered for **Pune Corporate Cars India Private Limited**.

Built based on official corporate specifications, incorporating comprehensive service catalogues, a 15-model fleet directory, transparent corporate pricing slabs, executive leadership profiles, 50+ pan-India service cities, client testimonials, and a real-time Operations Command Center.

---

### ✨ Key Features & Architecture

#### 1. Executive Frontend Design & Visual Effects
- **Prestige Color Palette**: Midnight Obsidian (`#050a16`), Royal Navy (`#0a1329`), Brushed Royal Gold (`#d4af37`), and Cyber Telemetry Cyan (`#00d2ff`).
- **Interactive Automotive Background Canvas**: High-performance animated canvas rendering mechanical wrenches, rotating gear sprockets, deflecting speedometer/tachometer gauges, engine pistons, and telemetry particle nodes with interactive mouse hover effects.
- **Dynamic Fare Calculator**: Instant quote generator calculating local 8H/80KM, airport flat rates, outstation per-km rates, and monthly corporate slabs with automated 5% GST and fare breakdown.
- **Interactive Fleet Explorer**: Filterable directory of all 15 official fleet vehicles (Dzire, Aura, Amaze, Ertiga, Rumion, Innova Crysta, Innova Hycross Hybrid, Fortuner, Mercedes E220/E250, Jaguar XF, BMW 3/5 Series, Camry Hybrid, Carnival) with passenger capacity, luggage volume, and direct "Book This Car" auto-fill actions.
- **Executive Leadership & Directors Section**: Biographies and vision of **Founder & MD Sanjay Nalawade**, executive directors for safety, client relations, and ESG compliance, backed by **ISO 9001:2015** and **ISO 14001:2015** badges.
- **Searchable Pan-India Footprint**: Live search across 50+ serviced Indian cities (Pune, Mumbai, Bangalore, Delhi NCR, Hyderabad, Chennai, Ahmedabad, Kolkata, etc.).
- **Corporate RFQ Tender Engine**: Dedicated form for enterprise shift commutes, MIDC factory worker shuttles, and long-term lease proposals.
- **Floating Contact Hub**: Direct 24×7 hotline call and WhatsApp connect.

#### 2. Robust Backend API & Database
- **Backend**: Node.js & Express REST API with input validation, sanitization, and structured status codes.
- **Database**: Zero-dependency SQLite via Node.js built-in `node:sqlite` (DatabaseSync), requiring no external compilation tools or native node-gyp bindings.
- **Pre-seeded Records**: Seeded with all 15 vehicles, pricing packages, 50+ locations, leadership team, verified client testimonials, admin account, and demo corporate bookings.

#### 3. Operations Command Admin Portal (`/admin`)
- **Key Metrics (KPIs)**: Total bookings, pending quotes, corporate RFQs, estimated pipeline revenue, active fleet count.
- **Live Dispatch Manager**: Search, filter by status (`New`, `Quoted`, `Confirmed`, `Completed`, `Cancelled`), assign drivers, and assign vehicle registration plates.
- **Corporate RFQs Manager**: Review and advance high-volume corporate tenders.
- **1-Click CSV Data Export**: Instant download of bookings and corporate leads in CSV format for Excel/CRM reporting (protected against spreadsheet formula injection).
- **Security & Access Control**: Cryptographically generated 256-bit ephemeral tokens with strict session expiry, Stored XSS sanitization, and server-side fare enforcement. Configure custom credentials via `.env`.

---

### 🚀 Getting Started

#### Prerequisites
- Node.js (v20 or v22+ recommended)
- npm

#### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (verifies 20/20 test cases)
node test-suite.js

# 3. Start the production server
npm start
```

The application will start on `http://localhost:3000`:
- **Public Client Website**: `http://localhost:3000`
- **Operations Admin Portal**: `http://localhost:3000/admin`
- **API Health Check**: `http://localhost:3000/api/health`

---

### 🔑 Security & Environment Variables
Configuration file: `.env` (Use `.env.example` as a template for production)
```env
PORT=3000
NODE_ENV=production
ADMIN_DEFAULT_USERNAME=your_admin_username
ADMIN_DEFAULT_PASSWORD=your_secure_production_password
```

---

### 📂 Project Structure
```
pune-corporate-cars/
├── database.js               # SQLite schema, foreign keys & seeding logic
├── server.js                 # Express server & REST API endpoints
├── package.json              # npm configuration & scripts
├── test-suite.js             # 14-point automated test verification suite
├── generate-car-assets.js    # Vector car asset generator
├── pune_corporate_cars.db    # Live SQLite database file
├── .env                      # Environment configuration
├── public/
│   ├── index.html            # Public website with all 16 corporate sections
│   ├── admin.html            # Executive Operations Command Center
│   ├── css/
│   │   ├── style.css         # Theme stylesheet (navy, gold, cyan, glassmorphism)
│   │   └── admin.css         # Admin portal styles
│   ├── js/
│   │   ├── car-tools-bg.js   # Automotive tools canvas animation
│   │   ├── main.js           # Frontend data integration, calculator & modals
│   │   └── admin.js          # Admin authentication, dispatch & CSV export
│   └── assets/
│       └── cars/             # 15 luxury vector vehicle illustrations
```

---

### 🏢 Official Corporate Entity Information
- **Company Name**: Pune Corporate Cars India Private Limited
- **Headquarters**: Gate No 124/2/1, Plot No. 86, Vishva Vilas City, Lane No. 08, Khandave Nagar, Nagar Road, Lohgaon, Haveli, Pune 412207, Maharashtra, India
- **24×7 Operations Hotline**: +91 9822943334 / +91 9405644855
- **Corporate Sales Desk**: +91 9822136667 / +91 7350959600
- **Reservations**: `reservations@punecorporatecars.com`
- **Managing Director**: `sanjay.nalawade@punecorporatecars.com`

