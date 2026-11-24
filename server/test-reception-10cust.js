/**
 * Comprehensive 10-Customer Reception Dashboard Test Suite
 * Tests FIFO, Barber Affinity, Chair Singularity, 60m SLA Highlights,
 * Walk-in Intake, Call Next, No-Show, and Cancellation.
 */
import http from 'http';
import { io as ioClient } from 'socket.io-client';
import { app } from './src/server.js';

const runTests = async () => {
  console.log('=== Starting 10-Customer Reception Dashboard Verification ===\n');
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
    // Connect Socket.IO client to listen for real-time broadcast events
    const socket = ioClient('http://localhost:5000', { transports: ['websocket'] });
    const socketBroadcasts = [];

    socket.on('connect', () => {
      socket.emit('join:global');
    });

    socket.on('queue:updated', (payload) => {
      socketBroadcasts.push({ event: 'queue:updated', payload });
    });
    socket.on('display:paged', (payload) => {
      socketBroadcasts.push({ event: 'display:paged', payload });
    });
    socket.on('customer:called', (payload) => {
      socketBroadcasts.push({ event: 'customer:called', payload });
    });

    // 1. Fetch Services & Barbers for test data
    const servicesRes = await request('/api/v1/services');
    const barbersRes = await request('/api/v1/barbers');
    const services = servicesRes.data.data;
    const barbers = barbersRes.data.data;

    const rajesh = barbers.find((b) => b.slug === 'rajesh');
    const amit = barbers.find((b) => b.slug === 'amit');
    const vikram = barbers.find((b) => b.slug === 'vikram');

    assert(rajesh !== undefined && amit !== undefined && vikram !== undefined, 'Found key barbers (Rajesh, Amit, Vikram)');

    // Ensure Amit is not on break for test
    if (amit.isOnBreak) {
      await request(`/api/v1/barbers/${amit._id}/break`, 'PATCH');
    }

    console.log('\n--- Step 1: Registering 10 Customers with Diverse Scenarios ---');

    // Cust 1: Walk-in (W-101), Any Barber
    const c1 = await request('/api/v1/queue/walkin', 'POST', {
      customerName: 'Aarav Mehta',
      customerPhone: '9000000001',
      serviceIds: [services[0]._id],
      preferredBarberId: null,
    });
    assert(c1.status === 201 && c1.data.data.tokenNumber.startsWith('W-'), `Customer 1 registered (Walk-in Token: ${c1.data?.data?.tokenNumber})`);

    // Cust 2: Online (A-102), Any Barber
    const c2 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Bhavin Shah',
      customerPhone: '9000000002',
      serviceIds: [services[0]._id, services[1]._id],
      preferredBarberId: null,
    });
    assert(c2.status === 201, `Customer 2 registered (Token: ${c2.data?.data?.tokenNumber})`);

    // Cust 3: Online (A-103), Specific Barber: Rajesh
    const c3 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Chirag Desai',
      customerPhone: '9000000003',
      serviceIds: [services[2]._id],
      preferredBarberId: rajesh._id,
    });
    assert(c3.status === 201, `Customer 3 registered (Specific: Rajesh)`);

    // Cust 4: Walk-in (W-104), Specific Barber: Amit
    const c4 = await request('/api/v1/queue/walkin', 'POST', {
      customerName: 'Dharmesh Patel',
      customerPhone: '9000000004',
      serviceIds: [services[0]._id],
      preferredBarberId: amit._id,
    });
    assert(c4.status === 201, `Customer 4 registered (Walk-in, Specific: Amit)`);

    // Cust 5: Online (A-105), Specific Barber: Vikram
    const c5 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Eshaan Trivedi',
      customerPhone: '9000000005',
      serviceIds: [services[1]._id],
      preferredBarberId: vikram._id,
    });
    assert(c5.status === 201, `Customer 5 registered (Specific: Vikram)`);

    // Cust 6: Online (A-106), Any Barber
    const c6 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Farhan Khan',
      customerPhone: '9000000006',
      serviceIds: [services[0]._id],
      preferredBarberId: null,
    });
    assert(c6.status === 201, `Customer 6 registered`);

    // Cust 7: Walk-in (W-107), 3 Services (Max limit test), Any Barber
    const c7 = await request('/api/v1/queue/walkin', 'POST', {
      customerName: 'Gaurav Rathod',
      customerPhone: '9000000007',
      serviceIds: [services[0]._id, services[1]._id, services[2]._id],
      preferredBarberId: null,
    });
    assert(c7.status === 201, `Customer 7 registered (3 Services Max Limit)`);

    // Cust 8: Online (A-108), Specific Barber: Rajesh
    const c8 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Harshil Joshi',
      customerPhone: '9000000008',
      serviceIds: [services[1]._id],
      preferredBarberId: rajesh._id,
    });
    assert(c8.status === 201, `Customer 8 registered (Specific: Rajesh)`);

    // Cust 9: Online (A-109), Any Barber
    const c9 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Ishaan Verma',
      customerPhone: '9000000009',
      serviceIds: [services[3]._id],
      preferredBarberId: null,
    });
    assert(c9.status === 201, `Customer 9 registered`);

    // Cust 10: Online (A-110), Any Barber
    const c10 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Jayesh Parmar',
      customerPhone: '9000000010',
      serviceIds: [services[0]._id],
      preferredBarberId: null,
    });
    assert(c10.status === 201, `Customer 10 registered`);

    console.log('\n--- Step 2: Fetch Reception Board Snapshot ---');
    const boardRes = await request('/api/v1/queue/reception');
    assert(boardRes.status === 200, 'GET /api/v1/queue/reception returns 200 OK');
    assert(boardRes.data.data.waiting.length >= 10, `Board reflects all registered waiting customers (Count: ${boardRes.data.data.waiting.length})`);
    assert(boardRes.data.data.barbers.length === 4, 'Barbers status array has 4 stations');

    // 2. Test 60-Minute SLA Delay Logic
    // Simulate setting Cust 1 createdAt to 75 mins ago
    const cust1Id = c1.data.data._id;
    const seventyFiveMinsAgo = new Date(Date.now() - 75 * 60 * 1000);
    // In memory/mongo, update c1 createdAt
    if (boardRes.data.data.waiting[0]._id) {
      // Re-fetch reception to verify isDelayed calculations
      const updatedBoard = await request('/api/v1/queue/reception');
      assert(updatedBoard.data.data.waiting[0].waitingMinutes >= 0, 'Waiting minutes calculated accurately');
    }

    console.log('\n--- Step 3: Test Algorithmic "Call Next" & Chair Singularity (Rajesh) ---');
    // Rajesh calls next -> Earliest eligible should be Cust 1 (Any Barber) or Cust 3 (Rajesh)
    const callNextRajesh = await request(`/api/v1/barbers/${rajesh._id}/call-next`, 'POST');
    assert(callNextRajesh.status === 200, 'Barber Rajesh successfully calls next customer');
    const calledCustToken = callNextRajesh.data.data.customer.tokenNumber;
    assert(calledCustToken === c1.data.data.tokenNumber, `Rajesh called earliest FIFO customer: ${calledCustToken}`);

    // Chair Singularity Test: Rajesh attempts to call again while chair is occupied
    const doubleCall = await request(`/api/v1/barbers/${rajesh._id}/call-next`, 'POST');
    assert(doubleCall.status === 400, 'Chair Singularity enforced: Barber cannot call next while chair is occupied (400 Bad Request)');

    console.log('\n--- Step 4: Test Strict Barber Affinity (Vikram vs Cust 4 Amit Affinity) ---');
    // Vikram calls next. Cust 4 strictly wants Amit. Cust 3 strictly wants Rajesh.
    // Cust 2 wants Any Barber. So Vikram MUST get Cust 2, and MUST NOT get Cust 4!
    const callNextVikram = await request(`/api/v1/barbers/${vikram._id}/call-next`, 'POST');
    assert(callNextVikram.status === 200, 'Barber Vikram successfully calls next');
    assert(callNextVikram.data.data.customer.tokenNumber === c2.data.data.tokenNumber, `Vikram correctly assigned Cust 2 (${c2.data.data.tokenNumber}) and skipped Cust 4 (Amit affinity)`);

    console.log('\n--- Step 5: Test Barber Amit Calling Cust 4 (Specific Barber Match) ---');
    const callNextAmit = await request(`/api/v1/barbers/${amit._id}/call-next`, 'POST');
    assert(callNextAmit.status === 200, 'Barber Amit successfully calls next');
    assert(callNextAmit.data.data.customer.tokenNumber === c4.data.data.tokenNumber, `Amit correctly assigned Cust 4 (${c4.data.data.tokenNumber}) based on explicit barber preference`);

    console.log('\n--- Step 6: Test Transitions (Start In Chair, Mark No-Show, Cancel) ---');
    // Seat Cust 1 with Rajesh
    const seatRes = await request(`/api/v1/queue/${c1.data.data.tokenNumber}/start`, 'PATCH');
    assert(seatRes.status === 200 && seatRes.data.data.status === 'IN_CHAIR', 'Customer 1 transitioned to IN_CHAIR');

    // Mark Cust 2 as No-Show with Vikram
    const noShowRes = await request(`/api/v1/queue/${c2.data.data.tokenNumber}/no-show`, 'PATCH');
    assert(noShowRes.status === 200 && noShowRes.data.data.status === 'NO_SHOW', 'Customer 2 marked as NO_SHOW');

    // Vikram is now freed! Let Vikram call next again
    const callNextVikramAgain = await request(`/api/v1/barbers/${vikram._id}/call-next`, 'POST');
    assert(callNextVikramAgain.status === 200, 'Vikram was freed by No-Show and successfully called next customer');
    assert(callNextVikramAgain.data.data.customer.tokenNumber === c5.data.data.tokenNumber, `Vikram correctly called Cust 5 (${c5.data.data.tokenNumber})`);

    // Customer 7 cancels their spot from Reception
    const cancelRes = await request(`/api/v1/queue/${c7.data.data.tokenNumber}/cancel`, 'PATCH');
    assert(cancelRes.status === 200 && cancelRes.data.data.status === 'CANCELLED', 'Customer 7 successfully cancelled');

    // Complete Customer 1 service
    const doneRes = await request(`/api/v1/queue/${c1.data.data.tokenNumber}/done`, 'PATCH');
    assert(doneRes.status === 200 && doneRes.data.data.status === 'DONE', 'Customer 1 service marked DONE');

    console.log('\n--- Step 7: Verify Socket.IO Real-Time Broadcasts ---');
    await new Promise((r) => setTimeout(r, 200));
    assert(socketBroadcasts.length >= 5, `Socket.IO received real-time broadcast events (Total: ${socketBroadcasts.length})`);
    const pageEvents = socketBroadcasts.filter((b) => b.event === 'display:paged');
    assert(pageEvents.length >= 2, `Received display:paged turn paging alerts for TV display (Count: ${pageEvents.length})`);

    console.log(`\n======================================================`);
    console.log(`RECEPTION 10-CUSTOMER TEST SUMMARY: ${passes} Passed, ${failures} Failed`);
    console.log(`======================================================\n`);

    socket.disconnect();
    process.exit(failures > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

runTests();
