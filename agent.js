/**
 * Pune Corporate Cars - AI Agent
 * Built with the Vercel AI SDK (ToolLoopAgent, tool, Zod inputSchema)
 * 
 * Provides automated corporate ground mobility assistance:
 * - Live fleet availability and specifications
 * - Pan-India city network & hub verification
 * - Dynamic corporate fare & tariff estimation
 * - Instant quotation & booking dispatch
 */

const { ToolLoopAgent, tool } = require('ai');
const { z } = require('zod');
const { db } = require('./database');

// Model provider loaders
let googleProvider = null;
let openaiProvider = null;

try {
  googleProvider = require('@ai-sdk/google').google;
} catch (e) {
  // Provider optional
}

try {
  openaiProvider = require('@ai-sdk/openai').openai;
} catch (e) {
  // Provider optional
}

/**
 * Resolve the active language model based on environment variables
 */
function resolveModel() {
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  if (geminiKey && googleProvider) {
    return {
      provider: 'google',
      modelName: 'gemini-2.5-flash',
      instance: googleProvider('gemini-2.5-flash')
    };
  }

  if (openaiKey && openaiProvider) {
    return {
      provider: 'openai',
      modelName: 'gpt-4o-mini',
      instance: openaiProvider('gpt-4o-mini')
    };
  }

  if (gatewayKey && openaiProvider) {
    return {
      provider: 'gateway',
      modelName: 'openai/gpt-4o-mini',
      instance: openaiProvider('gpt-4o-mini', {
        baseURL: 'https://ai-gateway.vercel.sh/v1'
      })
    };
  }

  return null;
}

// -------------------------------------------------------------
// VERCEL AI SDK TOOLS
// -------------------------------------------------------------

/**
 * Tool 1: Search Fleet
 */
const searchFleet = tool({
  description: 'Search available corporate and luxury vehicles in Pune Corporate Cars fleet by category, capacity, or model name.',
  inputSchema: z.object({
    category: z.string().optional().describe('Vehicle category filter (e.g. sedan, suv, luxury, mpv, all)'),
    minPassengers: z.number().optional().describe('Minimum number of passengers required'),
    keyword: z.string().optional().describe('Search keyword e.g. "Mercedes", "Innova", "EV", "BMW"')
  }),
  execute: async ({ category, minPassengers, keyword }) => {
    try {
      let query = 'SELECT * FROM fleet WHERE active = 1';
      const params = [];

      if (category && category !== 'all') {
        query += ' AND (category LIKE ? OR category_label LIKE ?)';
        params.push(`%${category}%`, `%${category}%`);
      }

      if (minPassengers) {
        query += ' AND passengers >= ?';
        params.push(minPassengers);
      }

      if (keyword) {
        query += ' AND (model LIKE ? OR category_label LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      query += ' ORDER BY sort_order ASC LIMIT 8';

      const rows = db.prepare(query).all(...params);
      const results = rows.map(r => ({
        id: r.id,
        model: r.model,
        category: r.category_label,
        passengers: r.passengers,
        luggage: r.luggage,
        baseFare8hr80km: `₹${r.base_fare_local.toLocaleString('en-IN')}`,
        outstationPerKm: `₹${r.per_km_outstation}/km`,
        airportTransfer: `₹${r.airport_fare.toLocaleString('en-IN')}`,
        imageUrl: r.image_url,
        features: JSON.parse(r.features || '[]')
      }));

      return {
        success: true,
        count: results.length,
        vehicles: results
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

/**
 * Tool 2: Check City Coverage
 */
const checkCityCoverage = tool({
  description: 'Verify if a city is serviced by Pune Corporate Cars across 100+ cities in India, and retrieve hub details.',
  inputSchema: z.object({
    city: z.string().describe('Name of the city e.g. Pune, Mumbai, Bengaluru, Hyderabad, Delhi')
  }),
  execute: async ({ city }) => {
    try {
      let cleanCity = city.trim();
      const cityLower = cleanCity.toLowerCase();
      
      // Standardize city synonyms
      if (cityLower === 'bangalore') cleanCity = 'Bengaluru';
      else if (cityLower === 'bombay') cleanCity = 'Mumbai';
      else if (cityLower === 'madras') cleanCity = 'Chennai';
      else if (cityLower === 'calcutta') cleanCity = 'Kolkata';

      let row = db.prepare('SELECT * FROM locations WHERE city LIKE ?').get(`%${cleanCity}%`);
      if (!row) {
        row = db.prepare('SELECT * FROM locations WHERE state LIKE ? LIMIT 1').get(`%${cleanCity}%`);
      }

      if (row) {
        let availableServices = [];
        try {
          availableServices = row.service_types.startsWith('[') ? JSON.parse(row.service_types) : row.service_types.split(',').map(s => s.trim());
        } catch (e) {
          availableServices = (row.service_types || '').split(',').map(s => s.trim());
        }

        return {
          supported: true,
          city: row.city,
          state: row.state,
          region: row.region,
          airportCode: row.airport_code || 'Available upon request',
          isMajorHub: Boolean(row.is_major),
          availableServices,
          message: `Pune Corporate Cars provides 24/7 dedicated chauffeur and corporate fleet operations in ${row.city}, ${row.state}.`
        };
      }

      // If city not directly listed, check state or regional hub
      const stateMatches = db.prepare('SELECT city, state FROM locations WHERE state LIKE ? LIMIT 5').all(`%${cleanCity}%`);
      if (stateMatches.length > 0) {
        return {
          supported: true,
          message: `We operate across ${cleanCity} through our regional network: ${stateMatches.map(m => m.city).join(', ')}.`,
          nearbyHubs: stateMatches
        };
      }

      return {
        supported: false,
        city: cleanCity,
        message: `While ${cleanCity} is outside our direct primary network, we arrange custom executive transit through our verified Pan-India partner network.`
      };
    } catch (err) {
      return { supported: false, error: err.message };
    }
  }
});

/**
 * Tool 3: Calculate Fare Estimate
 */
const calculateFareEstimate = tool({
  description: 'Calculate an accurate tariff estimation for corporate travel (Local 8hr/80km, Airport Transfer, or Outstation).',
  inputSchema: z.object({
    modelName: z.string().optional().describe('Vehicle model name e.g. "Toyota Innova Crysta", "Mercedes-Benz E-Class", "Toyota Camry"'),
    serviceType: z.enum(['local', 'airport', 'outstation']).describe('Service type: local (8hr/80km), airport, or outstation'),
    distanceKm: z.number().optional().describe('Estimated distance in kilometers (required for outstation)'),
    hours: z.number().optional().describe('Duration in hours for local rental')
  }),
  execute: async ({ modelName, serviceType, distanceKm = 80, hours = 8 }) => {
    try {
      let vehicle = null;
      if (modelName) {
        vehicle = db.prepare('SELECT * FROM fleet WHERE model LIKE ? LIMIT 1').get(`%${modelName}%`);
      }
      if (!vehicle) {
        // Fallback default vehicle (Innova Crysta)
        vehicle = db.prepare("SELECT * FROM fleet WHERE model = 'Toyota Innova Crysta'").get() ||
                  db.prepare('SELECT * FROM fleet LIMIT 1').get();
      }

      let baseFare = 0;
      let driverAllowance = 0;
      let extraKmRate = vehicle.per_km_outstation;
      let extraHourRate = Math.round(vehicle.base_fare_local / 8);

      if (serviceType === 'airport') {
        baseFare = vehicle.airport_fare;
      } else if (serviceType === 'outstation') {
        const billableKm = Math.max(distanceKm, 250); // Standard minimum 250 km/day for outstation
        baseFare = billableKm * vehicle.per_km_outstation;
        driverAllowance = 500; // standard outstation daily driver allowance
      } else {
        // local
        baseFare = vehicle.base_fare_local;
        const extraHours = Math.max(0, hours - 8);
        const extraKm = Math.max(0, distanceKm - 80);
        baseFare += (extraHours * extraHourRate) + (extraKm * extraKmRate);
      }

      const gst = Math.round(baseFare * 0.05); // 5% GST for passenger transport
      const totalEstimated = Math.round(baseFare + driverAllowance + gst);

      return {
        vehicle: vehicle.model,
        category: vehicle.category_label,
        serviceType,
        breakdown: {
          basePackage: `₹${Math.round(baseFare).toLocaleString('en-IN')}`,
          driverAllowance: driverAllowance > 0 ? `₹${driverAllowance}` : 'Included',
          gst5Percent: `₹${gst.toLocaleString('en-IN')}`,
          totalEstimate: `₹${totalEstimated.toLocaleString('en-IN')}`
        },
        inclusions: ['Uniformed Executive Chauffeur', 'Fuel & Maintenance', 'Cleaned & Sanitized Vehicle', '24/7 Operations Support'],
        note: 'Tolls, parking, and state border permits payable at actuals.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

/**
 * Tool 4: Create Booking Quote
 */
const createBookingQuote = tool({
  description: 'Generate an instant corporate booking inquiry reference and record it in the reservation queue.',
  inputSchema: z.object({
    customerName: z.string().describe('Full name of the corporate client or travel coordinator'),
    companyName: z.string().optional().describe('Name of the corporate organization'),
    phone: z.string().describe('Contact phone number with area/country code'),
    email: z.string().describe('Official or business email address'),
    serviceType: z.string().describe('Type of travel e.g. Corporate Car Rental, Airport Transfer, Executive Outstation'),
    pickupCity: z.string().describe('City of pickup'),
    destination: z.string().optional().describe('Destination city or drop location'),
    vehiclePreference: z.string().optional().describe('Preferred vehicle model or category'),
    pickupDate: z.string().describe('Travel date (YYYY-MM-DD)'),
    pickupTime: z.string().optional().describe('Pickup time (HH:MM)')
  }),
  execute: async (args) => {
    try {
      const bookingRef = `PCC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const pickupTime = args.pickupTime || '09:00 AM';
      const destination = args.destination || `${args.pickupCity} Local / As Directed`;
      const vehicleName = args.vehiclePreference || 'Executive Sedan / Premium SUV';

      const insertStmt = db.prepare(`
        INSERT INTO bookings (
          booking_ref, customer_name, company_name, phone, email,
          service_type, vehicle_name, pickup_city, destination,
          pickup_date, pickup_time, estimated_fare, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        bookingRef,
        args.customerName,
        args.companyName || 'Corporate Traveler',
        args.phone,
        args.email,
        args.serviceType,
        vehicleName,
        args.pickupCity,
        destination,
        args.pickupDate,
        pickupTime,
        4500, // placeholder estimated fare
        'AI Assistant Automated Priority Dispatch'
      );

      return {
        success: true,
        bookingRef,
        message: `Reservation confirmed for dispatch review! Your booking reference is ${bookingRef}. A dedicated PCC ground coordinator will contact ${args.customerName} shortly.`,
        details: {
          reference: bookingRef,
          passenger: args.customerName,
          company: args.companyName || 'Corporate',
          pickup: `${args.pickupCity} on ${args.pickupDate} at ${pickupTime}`,
          vehicle: vehicleName,
          status: 'PRIORITY_QUEUED'
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

// All registered tools
const agentTools = {
  searchFleet,
  checkCityCoverage,
  calculateFareEstimate,
  createBookingQuote
};

/**
 * Build the ToolLoopAgent instance
 */
function createPCCAgent() {
  const modelInfo = resolveModel();

  if (!modelInfo) {
    return {
      agent: null,
      modelInfo: null
    };
  }

  const agent = new ToolLoopAgent({
    model: modelInfo.instance,
    instructions: `You are the executive AI Concierge for Pune Corporate Cars India Pvt. Ltd. (PCC INDIA), an ISO 9001:2015 & ISO 14001:2015 certified luxury corporate ground transportation provider founded by Sanjay Nalawade and Prashant Nalawade.
You assist corporate clients, HR directors, travel managers, and executives with booking chauffeur-driven travel across 100+ cities in India.
Always maintain a courteous, ultra-professional, and efficient tone.
Use your tools to search the live fleet, verify city coverage, calculate transparent fare estimates, and generate instant corporate booking quotes.`,
    tools: agentTools
  });

  return {
    agent,
    modelInfo
  };
}

/**
 * Intelligent deterministic fallback concierge when no API keys are configured in local environment
 */
async function fallbackLocalConcierge(userMessage) {
  const text = (userMessage || '').toLowerCase();
  const toolResults = [];

  // Check 1: Fleet inquiry
  if (text.includes('fleet') || text.includes('car') || text.includes('vehicle') || text.includes('mercedes') || text.includes('bmw') || text.includes('innova') || text.includes('audi') || text.includes('suv') || text.includes('sedan')) {
    let category = 'all';
    let keyword = '';
    if (text.includes('suv')) category = 'suv';
    else if (text.includes('luxury')) category = 'luxury';
    else if (text.includes('sedan')) category = 'sedan';
    else if (text.includes('coach') || text.includes('bus')) category = 'coach';

    if (text.includes('mercedes')) keyword = 'Mercedes';
    else if (text.includes('bmw')) keyword = 'BMW';
    else if (text.includes('audi')) keyword = 'Audi';
    else if (text.includes('innova')) keyword = 'Innova';

    const fleetRes = await searchFleet.execute({ category, keyword });
    toolResults.push({ tool: 'searchFleet', result: fleetRes });

    const topCars = (fleetRes.vehicles || []).slice(0, 3).map(c => `• **${c.model}** (${c.category}) - ${c.passengers} Pax, ${c.luggage} Luggage | Base: ${c.baseFare8hr80km} | Airport: ${c.airportTransfer}`).join('\n');

    return {
      text: `Greetings from Pune Corporate Cars India Pvt. Ltd. Here are the premium vehicles matching your requirement:\n\n${topCars}\n\nAll our vehicles feature verified commercial permits, dual AC, GPS tracking, and uniformed executive chauffeurs. Would you like a detailed tariff calculation or to reserve a ride?`,
      toolCalls: [{ toolName: 'searchFleet', args: { category, keyword } }],
      toolResults,
      executionMode: 'smart_local_engine',
      model: 'deterministic-pcc-concierge'
    };
  }

  // Check 2: City coverage inquiry
  const cities = ['pune', 'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'delhi', 'chennai', 'ahmedabad', 'kolkata', 'goa', 'nashik', 'aurangabad', 'nagpur', 'jaipur'];
  const matchedCity = cities.find(c => text.includes(c));
  if (matchedCity || text.includes('city') || text.includes('network') || text.includes('coverage') || text.includes('location')) {
    const cityName = matchedCity ? matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1) : 'Pune';
    const cityRes = await checkCityCoverage.execute({ city: cityName });
    toolResults.push({ tool: 'checkCityCoverage', result: cityRes });

    return {
      text: `Pune Corporate Cars provides extensive corporate ground mobility services in **${cityRes.city || cityName}** and across 100+ cities in 19 regional hubs.\n\n` +
            `• **Coverage Status:** ${cityRes.supported ? 'Fully Supported with 24/7 Dispatch' : 'Covered via Pan-India Partner Network'}\n` +
            `• **Region / Hub:** ${cityRes.state || 'Maharashtra'} Hub\n` +
            `• **Available Services:** Corporate Car Rental, Airport Chauffeur Transfers, Employee Transportation Solutions, Conferences & Delegations.\n\n` +
            `How may we assist your itinerary in ${cityName}?`,
      toolCalls: [{ toolName: 'checkCityCoverage', args: { city: cityName } }],
      toolResults,
      executionMode: 'smart_local_engine',
      model: 'deterministic-pcc-concierge'
    };
  }

  // Check 3: Fare / tariff inquiry
  if (text.includes('fare') || text.includes('cost') || text.includes('price') || text.includes('rate') || text.includes('tariff') || text.includes('estimate')) {
    const isAirport = text.includes('airport');
    const isOutstation = text.includes('outstation') || text.includes('mumbai to pune') || text.includes('pune to mumbai');
    const serviceType = isAirport ? 'airport' : (isOutstation ? 'outstation' : 'local');
    const distanceKm = isOutstation ? 300 : (isAirport ? 40 : 80);

    let modelName = 'Toyota Innova Crysta';
    if (text.includes('mercedes')) modelName = 'Mercedes-Benz E-Class';
    else if (text.includes('bmw')) modelName = 'BMW 5 Series';
    else if (text.includes('audi')) modelName = 'Audi A6';
    else if (text.includes('camry')) modelName = 'Toyota Camry Hybrid';

    const fareRes = await calculateFareEstimate.execute({ modelName, serviceType, distanceKm, hours: 8 });
    toolResults.push({ tool: 'calculateFareEstimate', result: fareRes });

    return {
      text: `Here is the transparent corporate tariff estimate for **${fareRes.vehicle}** (${fareRes.category}):\n\n` +
            `• **Service Type:** ${fareRes.serviceType.toUpperCase()}\n` +
            `• **Base Package:** ${fareRes.breakdown.basePackage}\n` +
            `• **Driver Allowance:** ${fareRes.breakdown.driverAllowance}\n` +
            `• **GST (5%):** ${fareRes.breakdown.gst5Percent}\n` +
            `• **Estimated Total:** **${fareRes.breakdown.totalEstimate}**\n\n` +
            `*Includes executive chauffeur, commercial passenger insurance, and 24/7 roadside tracking.*`,
      toolCalls: [{ toolName: 'calculateFareEstimate', args: { modelName, serviceType, distanceKm } }],
      toolResults,
      executionMode: 'smart_local_engine',
      model: 'deterministic-pcc-concierge'
    };
  }

  // Default welcome & assistance prompt
  return {
    text: `Welcome to **Pune Corporate Cars India Pvt. Ltd.** Executive AI Concierge.\n\n` +
          `I can assist you with:\n` +
          `1. 🚘 **Fleet Inquiries:** Search luxury sedans (Mercedes, BMW, Audi, Camry), corporate SUVs (Innova Crysta, Fortuner), and executive buses.\n` +
          `2. 📍 **Pan-India Network:** Check city coverage and airport transfer availability across 100+ cities.\n` +
          `3. 💰 **Fare Estimation:** Instant calculations for local 8hr/80km packages, airport runs, and outstation trips.\n` +
          `4. 📝 **Instant Reservation:** Generate a verified booking quote reference for immediate dispatch.\n\n` +
          `How can I assist your business journey today?`,
    toolCalls: [],
    toolResults: [],
    executionMode: 'smart_local_engine',
    model: 'deterministic-pcc-concierge'
  };
}

/**
 * Main execution handler: runs ToolLoopAgent when model configured, or fallback engine
 */
async function runPCCAgent({ prompt, messages = [] }) {
  const { agent, modelInfo } = createPCCAgent();
  const query = prompt || (messages.length > 0 ? messages[messages.length - 1].content : '');

  if (agent && modelInfo) {
    try {
      const response = await agent.generate({
        prompt: query,
        messages: messages.length > 0 ? messages : undefined
      });

      return {
        text: response.text,
        toolCalls: response.toolCalls || [],
        toolResults: response.toolResults || [],
        executionMode: 'vercel_ai_sdk_llm',
        model: modelInfo.modelName,
        provider: modelInfo.provider
      };
    } catch (err) {
      console.warn('AI SDK Agent execution fallback:', err.message);
      // Fallback to local engine if LLM provider returns quota/auth error
      const fallbackRes = await fallbackLocalConcierge(query);
      fallbackRes.warning = `LLM Provider note: ${err.message}. Seamlessly serviced via PCC Ground Mobility Engine.`;
      return fallbackRes;
    }
  }

  // Zero-downtime smart local engine
  return await fallbackLocalConcierge(query);
}

module.exports = {
  pccAgent: createPCCAgent(),
  agentTools,
  runPCCAgent,
  resolveModel,
  searchFleet,
  checkCityCoverage,
  calculateFareEstimate,
  createBookingQuote
};
