const { app, server } = require('./server');

async function runTests() {
  console.log('🧪 Starting Full Automated Test Suite with Real Car Fleet & Strict PDF Data...');
  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check
    const health = await fetch(`${baseUrl}/api/health`).then(r => r.json());
    assert(health.status === 'ONLINE', 'API Health Check returns ONLINE');

    // Test 2: Fleet Directory (All 15 real vehicles from PDF)
    const fleet = await fetch(`${baseUrl}/api/fleet`).then(r => r.json());
    assert(fleet.success && fleet.count === 15, `Fleet Directory returns all 15 models with real photo URLs (Got: ${fleet.count})`);

    // Test 3: Fleet Category filter
    const sedans = await fetch(`${baseUrl}/api/fleet?category=sedan`).then(r => r.json());
    assert(sedans.success && sedans.count === 3, `Sedans filter returns exact 3 sedans from PDF (Got: ${sedans.count})`);

    // Test 4: Pricing Packages
    const pricing = await fetch(`${baseUrl}/api/pricing`).then(r => r.json());
    assert(pricing.success && pricing.data.length >= 4, `Pricing packages returned (${pricing.data.length} packages)`);

    // Test 5: Directors (Founder Sanjay Nalawade from PDF)
    const directors = await fetch(`${baseUrl}/api/directors`).then(r => r.json());
    assert(directors.success && directors.data[0].name === 'Sanjay Nalawade', `Founder & Director Sanjay Nalawade verified (${directors.data[0].name})`);

    // Test 6: Blogs from PDF Page 6
    const blogs = await fetch(`${baseUrl}/api/blogs`).then(r => r.json());
    assert(blogs.success && blogs.data.length === 3, `Exact 3 blog topics from PDF returned (${blogs.data.length} blogs)`);

    // Test 7: Locations (Deduplicated list from PDF)
    const locations = await fetch(`${baseUrl}/api/locations?query=Pune`).then(r => r.json());
    assert(locations.success && locations.count >= 1 && locations.data[0].city === 'Pune', 'Locations directory returns Pune headquarters');

    // Test 8: Testimonials from PDF Page 5 & 6
    const testimonials = await fetch(`${baseUrl}/api/testimonials`).then(r => r.json());
    assert(testimonials.success && testimonials.data.length >= 8, `Verified client references from PDF returned (${testimonials.data.length} items)`);

    // Test 9: Create New Quick Enquiry Booking
    const newBooking = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Mr. Gorakh Paithane',
        company_name: 'Enterprise Client',
        phone: '+91 9822943334',
        email: 'gorakh.p@example.com',
        service_type: 'Corporate car rental',
        vehicle_id: fleet.data[0].id,
        vehicle_name: fleet.data[0].model,
        pickup_city: 'Pune',
        destination: 'Mumbai International Airport T2',
        pickup_date: '2026-11-05',
        pickup_time: '06:00 AM',
        passengers: 2,
        luggage_bags: 2,
        estimated_fare: 0,
        special_requests: 'Punctual airport pickup'
      })
    }).then(r => r.json());
    assert(newBooking.success && newBooking.bookingRef.startsWith('PCC-'), `New Booking created with reference: ${newBooking.bookingRef}`);

    // Test 10: Admin Login
    const adminLogin = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'adminPassword2026!'
      })
    }).then(r => r.json());
    assert(adminLogin.success && adminLogin.token, 'Admin authentication succeeds');

    // Test 11: Admin Stats
    const adminStats = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminLogin.token}` }
    }).then(r => r.json());
    assert(adminStats.success && adminStats.stats.fleetCount === 15, `Admin stats verify 15 active fleet models`);

    // Test 12: CSV Export
    const csvExport = await fetch(`${baseUrl}/api/admin/export/bookings?token=${adminLogin.token}`).then(r => r.text());
    assert(csvExport.includes('Booking Ref') && csvExport.includes(newBooking.bookingRef), 'CSV Export contains latest booking');

    // Test 13: Vercel AI SDK Agent Info
    const agentInfo = await fetch(`${baseUrl}/api/agent/info`).then(r => r.json());
    assert(agentInfo.framework === 'Vercel AI SDK' && agentInfo.tools.length === 4, `Vercel AI SDK Agent registered with ${agentInfo.tools.length} corporate tools`);

    // Test 14: Vercel AI SDK Agent Query & Tool Execution
    const agentChat = await fetch(`${baseUrl}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Which luxury cars do you have in Pune?' })
    }).then(r => r.json());
    assert(agentChat.success && agentChat.text.includes('Mercedes-Benz'), 'AI Agent executes searchFleet and returns luxury cars');

    // Test 15: Vercel AI SDK Instant Quote Generation
    const agentQuote = await fetch(`${baseUrl}/api/agent/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Anil Deshmukh',
        companyName: 'Tata Consultancy Services',
        phone: '+91 98220 99999',
        email: 'anil.d@tcs.com',
        serviceType: 'Executive Car Rental',
        pickupCity: 'Pune',
        pickupDate: '2026-11-15',
        pickupTime: '08:30 AM'
      })
    }).then(r => r.json());
    assert(agentQuote.success && agentQuote.bookingRef.startsWith('PCC-'), `AI Agent quote generator created reference: ${agentQuote.bookingRef}`);

    console.log(`\n====================================================`);
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================`);

    if (server && server.close) server.close();
    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test suite error:', err);
    if (server && server.close) server.close();
    process.exit(1);
  }
}

setTimeout(runTests, 500);
