const fs = require('node:fs');
const path = require('node:path');

const cars = [
  { file: 'dzire.svg', name: 'Maruti Suzuki Dzire', type: 'sedan', color1: '#3b82f6', color2: '#1d4ed8', badge: 'ECONOMY SEDAN', seats: '4 PAX' },
  { file: 'aura.svg', name: 'Hyundai Aura', type: 'sedan', color1: '#06b6d4', color2: '#0e7490', badge: 'COMFORT SEDAN', seats: '4 PAX' },
  { file: 'amaze.svg', name: 'Honda Amaze', type: 'sedan', color1: '#6366f1', color2: '#4338ca', badge: 'COMFORT SEDAN', seats: '4 PAX' },
  { file: 'ertiga.svg', name: 'Maruti Suzuki Ertiga', type: 'mpv', color1: '#f59e0b', color2: '#b45309', badge: 'CORPORATE MPV', seats: '7 PAX' },
  { file: 'rumion.svg', name: 'Toyota Rumion', type: 'mpv', color1: '#ec4899', color2: '#be185d', badge: 'PREMIUM MPV', seats: '7 PAX' },
  { file: 'innova-crysta.svg', name: 'Toyota Innova Crysta', type: 'mpv', color1: '#10b981', color2: '#047857', badge: 'EXECUTIVE MPV', seats: '7 PAX' },
  { file: 'innova-hycross.svg', name: 'Toyota Innova Hycross', type: 'mpv', color1: '#14b8a6', color2: '#0f766e', badge: 'HYBRID VIP MPV', seats: '7 PAX' },
  { file: 'carnival.svg', name: 'Kia Carnival', type: 'mpv', color1: '#8b5cf6', color2: '#6d28d9', badge: 'LUXURY VIP MPV', seats: '7 PAX' },
  { file: 'camry.svg', name: 'Toyota Camry', type: 'luxury', color1: '#eab308', color2: '#a16207', badge: 'PREMIUM HYBRID', seats: '4 PAX' },
  { file: 'bmw3.svg', name: 'BMW 3 Series', type: 'luxury', color1: '#38bdf8', color2: '#0284c7', badge: 'GERMAN LUXURY', seats: '4 PAX' },
  { file: 'bmw5.svg', name: 'BMW 5 Series', type: 'luxury', color1: '#60a5fa', color2: '#2563eb', badge: 'EXECUTIVE LUXURY', seats: '4 PAX' },
  { file: 'mercedes-e220.svg', name: 'Mercedes-Benz E220', type: 'luxury', color1: '#d4af37', color2: '#997b1a', badge: 'LUXURY SEDAN', seats: '4 PAX' },
  { file: 'mercedes-e250.svg', name: 'Mercedes-Benz E250', type: 'luxury', color1: '#f59e0b', color2: '#b45309', badge: 'ELITE LUXURY', seats: '4 PAX' },
  { file: 'jaguar-xf.svg', name: 'Jaguar XF', type: 'luxury', color1: '#f43f5e', color2: '#be123c', badge: 'ROYAL SIGNATURE', seats: '4 PAX' },
  { file: 'fortuner.svg', name: 'Toyota Fortuner', type: 'suv', color1: '#e11d48', color2: '#9f1239', badge: 'EXECUTIVE SUV', seats: '7 PAX' }
];

function generateCarSvg(car) {
  const isSUV = car.type === 'suv';
  const isMPV = car.type === 'mpv';
  const isLuxury = car.type === 'luxury';

  // Body height and profile adjustments
  let roofY = isSUV ? 60 : isMPV ? 70 : 85;
  let bodyY = isSUV ? 115 : isMPV ? 120 : 130;
  let groundY = 175;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 240" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="bodyGrad_${car.file.replace(/[^a-z0-9]/gi, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${car.color1}" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.98" />
      <stop offset="100%" stop-color="${car.color2}" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="wheelRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="50%" stop-color="#64748b" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <radialGradient id="headlightGlow" cx="10%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#67e8f9" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
    </radialGradient>
    <filter id="carDropShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Studio Lighting Glow -->
  <ellipse cx="220" cy="205" rx="190" ry="16" fill="#000000" opacity="0.45" />
  <ellipse cx="220" cy="205" rx="140" ry="8" fill="#000000" opacity="0.65" />

  <!-- Car Chassis Group with shadow -->
  <g filter="url(#carDropShadow)">
    <!-- Main Car Bodywork -->
    ${isSUV ? `
      <!-- SUV Body Profile -->
      <path d="M 50 148 L 75 142 L 105 105 L 140 68 L 295 68 L 360 100 L 390 120 L 405 145 L 395 170 L 340 170 A 32 32 0 0 1 276 170 L 160 170 A 32 32 0 0 1 96 170 L 50 170 Z" 
            fill="url(#bodyGrad_${car.file.replace(/[^a-z0-9]/gi, '')})" stroke="#475569" stroke-width="1.5" />
      <!-- SUV Cabin Glass -->
      <path d="M 115 105 L 145 74 L 235 74 L 235 125 L 98 125 Z" fill="url(#glassGrad)" stroke="#38bdf8" stroke-width="1" />
      <path d="M 245 74 L 290 74 L 348 105 L 345 125 L 245 125 Z" fill="url(#glassGrad)" stroke="#38bdf8" stroke-width="1" />
      <!-- Roof Rails -->
      <rect x="140" y="60" width="155" height="4" rx="2" fill="#94a3b8" />
    ` : isMPV ? `
      <!-- MPV Body Profile -->
      <path d="M 45 152 L 70 146 L 100 115 L 150 78 L 310 80 L 365 110 L 395 128 L 405 150 L 395 170 L 340 170 A 30 30 0 0 1 280 170 L 160 170 A 30 30 0 0 1 100 170 L 45 170 Z" 
            fill="url(#bodyGrad_${car.file.replace(/[^a-z0-9]/gi, '')})" stroke="#475569" stroke-width="1.5" />
      <!-- MPV Windows -->
      <path d="M 110 115 L 155 84 L 230 84 L 230 130 L 90 130 Z" fill="url(#glassGrad)" stroke="#38bdf8" stroke-width="1" />
      <path d="M 240 84 L 305 84 L 355 112 L 350 130 L 240 130 Z" fill="url(#glassGrad)" stroke="#38bdf8" stroke-width="1" />
    ` : `
      <!-- Streamlined Luxury Sedan Profile -->
      <path d="M 40 155 L 75 145 L 115 120 L 160 92 L 275 92 L 335 118 L 385 132 L 408 152 L 395 170 L 342 170 A 28 28 0 0 1 286 170 L 156 170 A 28 28 0 0 1 100 170 L 40 170 Z" 
            fill="url(#bodyGrad_${car.file.replace(/[^a-z0-9]/gi, '')})" stroke="#64748b" stroke-width="1.5" />
      <!-- Sedan Sleek Aerodynamic Windows -->
      <path d="M 125 120 L 165 98 L 225 98 L 225 132 L 105 132 Z" fill="url(#glassGrad)" stroke="#38bdf8" stroke-width="1" />
      <path d="M 235 98 L 270 98 L 325 120 L 315 132 L 235 132 Z" fill="url(#glassGrad)" stroke="#38bdf8" stroke-width="1" />
      <!-- Chrome Window Beltline -->
      <line x1="95" y1="134" x2="330" y2="134" stroke="#d4af37" stroke-width="1.5" />
    `}

    <!-- Headlights & Taillights -->
    <path d="M 400 145 L 406 148 L 398 155 Z" fill="#67e8f9" filter="drop-shadow(0 0 6px #22d3ee)" />
    <path d="M 42 154 L 46 156 L 44 163 Z" fill="#ef4444" filter="drop-shadow(0 0 6px #f87171)" />

    <!-- Front & Rear Wheels -->
    <!-- Rear Wheel -->
    <g transform="translate(128, 170)">
      <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#334155" stroke-width="4" />
      <circle cx="0" cy="0" r="18" fill="url(#wheelRim)" />
      <!-- Alloy Spokes -->
      <line x1="-15" y1="0" x2="15" y2="0" stroke="#f8fafc" stroke-width="2.5" />
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#f8fafc" stroke-width="2.5" />
      <line x1="-11" y1="-11" x2="11" y2="11" stroke="#f8fafc" stroke-width="2.5" />
      <line x1="-11" y1="11" x2="11" y2="-11" stroke="#f8fafc" stroke-width="2.5" />
      <circle cx="0" cy="0" r="6" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" />
    </g>

    <!-- Front Wheel -->
    <g transform="translate(314, 170)">
      <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#334155" stroke-width="4" />
      <circle cx="0" cy="0" r="18" fill="url(#wheelRim)" />
      <!-- Alloy Spokes -->
      <line x1="-15" y1="0" x2="15" y2="0" stroke="#f8fafc" stroke-width="2.5" />
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#f8fafc" stroke-width="2.5" />
      <line x1="-11" y1="-11" x2="11" y2="11" stroke="#f8fafc" stroke-width="2.5" />
      <line x1="-11" y1="11" x2="11" y2="-11" stroke="#f8fafc" stroke-width="2.5" />
      <circle cx="0" cy="0" r="6" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" />
    </g>

    <!-- Door Handles & Character lines -->
    <line x1="160" y1="140" x2="175" y2="140" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
    <line x1="235" y1="140" x2="250" y2="140" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Badge / Tag overlay -->
  <g transform="translate(20, 24)">
    <rect x="0" y="0" width="130" height="24" rx="12" fill="#0f172a" fill-opacity="0.85" stroke="${car.color1}" stroke-width="1" />
    <circle cx="12" cy="12" r="4" fill="${car.color1}" />
    <text x="24" y="16" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">${car.badge}</text>
  </g>

  <!-- Seating Capacity Tag -->
  <g transform="translate(330, 24)">
    <rect x="0" y="0" width="85" height="24" rx="12" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="1" />
    <text x="42" y="16" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600">${car.seats}</text>
  </g>
</svg>
  `.trim();
}

const dir = path.join(__dirname, 'public', 'assets', 'cars');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

for (const car of cars) {
  const filePath = path.join(dir, car.file);
  fs.writeFileSync(filePath, generateCarSvg(car), 'utf8');
}

console.log(`Generated all ${cars.length} luxury vector car assets successfully!`);

