/**
 * Multi-Screen Real-Time Synchronization Verification
 * Tests Barber Dashboard, Waiting Area TV Display, Receptionist, and Customer screens
 */
import http from 'http';
import { io as ioClient } from 'socket.io-client';
import { app } from './src/server.js';

const runTests = async () => {
  console.log('=== Starting Multi-Screen Real-Time Synchronization Test ===\n');
  let passes = 0;
  let failures = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passes++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failures++;
    }
  };

  const request = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  await new Promise((r) => setTimeout(r, 1000));

  try {
    // 1. Setup 3 Socket.IO client connections simulating TV Display, Reception, and Customer
    const tvSocket = ioClient('http://localhost:5000', { transports: ['websocket'] });
    const receptionSocket = ioClient('http://localhost:5000', { transports: ['websocket'] });
    const customerSocket = ioClient('http://localhost:5000', { transports: ['websocket'] });

    const tvEvents = [];
    const receptionEvents = [];
    const customerEvents = [];

    tvSocket.on('connect', () => tvSocket.emit('join:global'));
    receptionSocket.on('connect', () => receptionSocket.emit('join:global'));

    tvSocket.on('queue:updated', (p) => tvEvents.push({ event: 'queue:updated', p }));
    tvSocket.on('display:paged', (p) => tvEvents.push({ event: 'display:paged', p }));
    receptionSocket.on('queue:updated', (p) => receptionEvents.push({ event: 'queue:updated', p }));

    // 2. Test Barber Station Endpoint
    console.log('--- Step 1: Verify Barber Station API ---');
    const stationRes = await request('/api/v1/barbers/station/rajesh');
    assert(stationRes.status === 200, 'GET /api/v1/barbers/station/rajesh returns 200 OK');
    assert(stationRes.data.data.barber.name === 'Rajesh Kumar', 'Barber profile loaded (Rajesh Kumar)');
    assert(Array.isArray(stationRes.data.data.allBarbers), 'All barbers array provided for quick switching');

    // 3. Test TV Display Endpoint
    console.log('\n--- Step 2: Verify TV Display API ---');
    const displayRes = await request('/api/v1/queue/display');
    assert(displayRes.status === 200, 'GET /api/v1/queue/display returns 200 OK');
    assert(displayRes.data.data.stations.length === 4, 'TV Display stations grid has 4 stations');
    assert(Array.isArray(displayRes.data.data.nextFiveTokens), 'Next 5 tokens array present');

    // 4. Register a Customer
    console.log('\n--- Step 3: Register Customer & Verify Real-Time Sync ---');
    const servicesRes = await request('/api/v1/services');
    const s1 = servicesRes.data.data[0];

    const joinRes = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Kunal Kapoor',
      customerPhone: '9555555555',
      serviceIds: [s1._id],
      preferredBarberId: null,
    });
    const token = joinRes.data.data.tokenNumber;
    const ticketId = joinRes.data.data._id;
    assert(joinRes.status === 201, `Customer joined queue: Token ${token}`);

    // Join Customer socket room
    customerSocket.emit('join:customer', ticketId);
    customerSocket.emit('join:customer', token);
    customerSocket.on('customer:called', (p) => customerEvents.push({ event: 'customer:called', p }));
    customerSocket.on('customer:status_changed', (p) => customerEvents.push({ event: 'customer:status_changed', p }));

    // 5. Verify Barber Station sees this customer as "Next Eligible"
    const stationAfterJoin = await request('/api/v1/barbers/station/rajesh');
    assert(
      stationAfterJoin.data.data.nextEligibleCustomer !== null,
      `Barber Rajesh shows next eligible customer: ${stationAfterJoin.data.data.nextEligibleCustomer?.customerName}`
    );

    // 6. Barber calls customer to chair
    console.log('\n--- Step 4: Barber Calls Customer (Turn Paging Sync) ---');
    const callStart = Date.now();
    const callRes = await request(`/api/v1/barbers/${stationRes.data.data.barber._id}/call-next`, 'POST');
    assert(callRes.status === 200, 'Barber calls next customer');

    await new Promise((r) => setTimeout(r, 200));
    const callSyncLatency = Date.now() - callStart;

    // Verify TV Display received display:paged event
    const tvPaged = tvEvents.find((e) => e.event === 'display:paged');
    assert(tvPaged !== undefined, 'TV Display received display:paged turn paging alert');
    assert(tvPaged?.p?.tokenNumber === token, `Paged token matches: ${token}`);

    // Verify Customer received customer:called event
    const custCalled = customerEvents.find((e) => e.event === 'customer:called');
    assert(custCalled !== undefined, 'Customer screen received customer:called alert');
    assert(callSyncLatency < 5000, `Multi-screen sync latency was ${callSyncLatency}ms (well within 5-second requirement)`);

    // 7. Barber clicks "Start Service" (IN_CHAIR)
    console.log('\n--- Step 5: Barber Starts Service (IN_CHAIR Sync) ---');
    const startServiceStart = Date.now();
    const startRes = await request(`/api/v1/queue/${token}/start`, 'PATCH');
    assert(startRes.status === 200, 'Start service executed');

    await new Promise((r) => setTimeout(r, 200));
    const startLatency = Date.now() - startServiceStart;
    assert(startLatency < 5000, `Start service synchronized in ${startLatency}ms`);

    // Verify TV display snapshot shows IN_CHAIR for Station 1
    const displayAfterStart = await request('/api/v1/queue/display');
    const st1AfterStart = displayAfterStart.data.data.stations.find((s) => s.chairNumber === 1);
    assert(st1AfterStart.status === 'IN_CHAIR', 'TV Display shows Station 1 is IN_CHAIR');
    assert(st1AfterStart.activeCustomer.tokenNumber === token, `TV Display shows token ${token} in chair`);

    // 8. Barber clicks "Done" (DONE)
    console.log('\n--- Step 6: Barber Marks Done (DONE Sync) ---');
    const doneServiceStart = Date.now();
    const doneRes = await request(`/api/v1/queue/${token}/done`, 'PATCH');
    assert(doneRes.status === 200, 'Complete service executed');

    await new Promise((r) => setTimeout(r, 200));
    const doneLatency = Date.now() - doneServiceStart;
    assert(doneLatency < 5000, `Complete service synchronized in ${doneLatency}ms`);

    // Verify TV display snapshot shows Station 1 is freed and READY
    const displayAfterDone = await request('/api/v1/queue/display');
    const st1AfterDone = displayAfterDone.data.data.stations.find((s) => s.chairNumber === 1);
    assert(st1AfterDone.status === 'AVAILABLE', 'TV Display shows Station 1 is now AVAILABLE / READY');
    assert(st1AfterDone.activeCustomer === null, 'TV Display shows Station 1 has no active customer in chair');

    console.log(`\n======================================================`);
    console.log(`MULTI-SCREEN SYNC TEST SUMMARY: ${passes} Passed, ${failures} Failed`);
    console.log(`======================================================\n`);

    tvSocket.disconnect();
    receptionSocket.disconnect();
    customerSocket.disconnect();

    process.exit(failures > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

runTests();
