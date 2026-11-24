/**
 * Multi-Customer Queue Status, Real-Time Paging & Cancellation Verification
 */
import http from 'http';
import { io as ioClient } from 'socket.io-client';
import { app } from './src/server.js';

const runTests = async () => {
  console.log('--- Starting Multi-Customer Status Screen Verification ---');
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
    // Connect a test Socket.IO client
    const socket = ioClient('http://localhost:5000', {
      transports: ['websocket'],
    });

    const receivedSocketEvents = [];
    socket.on('connect', () => {
      console.log('   [Test Socket] Connected with ID:', socket.id);
    });

    socket.on('customer:called', (payload) => {
      receivedSocketEvents.push({ event: 'customer:called', payload });
    });

    socket.on('customer:status_changed', (payload) => {
      receivedSocketEvents.push({ event: 'customer:status_changed', payload });
    });

    socket.on('queue:updated', (payload) => {
      receivedSocketEvents.push({ event: 'queue:updated', payload });
    });

    // 1. Get Services to use in joining
    const servicesRes = await request('/api/v1/services');
    const s1 = servicesRes.data.data[0];
    const s2 = servicesRes.data.data[1];

    // 2. Customer 1 Joins (Kavita)
    const cust1 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Kavita Joshi',
      customerPhone: '9811111111',
      serviceIds: [s1._id],
    });
    const token1 = cust1.data.data.tokenNumber;
    assert(cust1.status === 201, `Customer 1 joined: Token ${token1}`);

    // Subscribe socket to Customer 1's room
    socket.emit('join:customer', cust1.data.data._id);
    socket.emit('join:customer', token1);

    // 3. Customer 2 Joins (Rohit)
    const cust2 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Rohit Sharma',
      customerPhone: '9822222222',
      serviceIds: [s1._id, s2._id],
    });
    const token2 = cust2.data.data.tokenNumber;
    assert(cust2.status === 201, `Customer 2 joined: Token ${token2}`);

    // 4. Customer 3 Joins (Pooja)
    const cust3 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Pooja Vora',
      customerPhone: '9833333333',
      serviceIds: [s2._id],
    });
    const token3 = cust3.data.data.tokenNumber;
    assert(cust3.status === 201, `Customer 3 joined: Token ${token3}`);

    // 5. Verify Positions for Customer 1, 2, and 3
    const status1 = await request(`/api/v1/queue/status/${token1}`);
    assert(status1.data.data.position === 1, `Customer 1 is #1 in line (NEXT): Position ${status1.data.data.position}`);
    assert(status1.data.data.status === 'WAITING', 'Customer 1 status is WAITING');

    const status2 = await request(`/api/v1/queue/status/${token2}`);
    assert(status2.data.data.position === 2, `Customer 2 is #2 in line (START COMING): Position ${status2.data.data.position}`);
    assert(status2.data.data.estimatedWaitMinutes > 0, `Customer 2 EWT calculated: ~${status2.data.data.estimatedWaitMinutes}m`);

    const status3 = await request(`/api/v1/queue/status/${token3}`);
    assert(status3.data.data.position === 3, `Customer 3 is #3 in line: Position ${status3.data.data.position}`);

    // 6. Barber calls Customer 1 to chair (PATCH /queue/:id/call)
    console.log(`\n--- Calling Customer 1 (${token1}) ---`);
    const callRes = await request(`/api/v1/queue/${token1}/call`, 'PATCH');
    assert(callRes.status === 200, `Call Next executed for ${token1}`);
    assert(callRes.data.data.status === 'CALLED', 'Customer 1 status updated to CALLED');
    assert(callRes.data.data.assignedBarber !== undefined, `Assigned barber: ${callRes.data.data.assignedBarber?.name}`);

    // Wait 200ms for Socket.IO event propagation
    await new Promise((r) => setTimeout(r, 200));

    const calledEvent = receivedSocketEvents.find((e) => e.event === 'customer:called');
    assert(calledEvent !== undefined, 'Socket.IO emitted "customer:called" real-time event');
    assert(calledEvent?.payload?.tokenNumber === token1, `Socket payload has tokenNumber ${token1}`);

    // 7. Verify Customer 2 has advanced from #2 to #1 in line!
    const status2AfterCall = await request(`/api/v1/queue/status/${token2}`);
    assert(status2AfterCall.data.data.position === 1, `Customer 2 advanced to #1 in line! (Position: ${status2AfterCall.data.data.position})`);

    // 8. Verify Customer 3 has advanced from #3 to #2 ("Start Coming")!
    const status3AfterCall = await request(`/api/v1/queue/status/${token3}`);
    assert(status3AfterCall.data.data.position === 2, `Customer 3 advanced to #2 in line ("Start Coming" threshold)! (Position: ${status3AfterCall.data.data.position})`);

    // 9. Customer 3 Cancels Spot (PATCH /queue/:id/cancel)
    console.log(`\n--- Customer 3 (${token3}) Cancels Spot ---`);
    const cancelRes = await request(`/api/v1/queue/${token3}/cancel`, 'PATCH');
    assert(cancelRes.status === 200, `Customer 3 cancellation successful`);
    assert(cancelRes.data.data.status === 'CANCELLED', 'Customer 3 status updated to CANCELLED');

    // 10. Verify Cancelled Customer Cannot Be Re-cancelled
    const doubleCancelRes = await request(`/api/v1/queue/${token3}/cancel`, 'PATCH');
    assert(doubleCancelRes.status === 400, 'Re-cancelling non-waiting ticket is rejected with 400 Bad Request');

    // 11. Customer 1 enters chair (IN_CHAIR) and completes (DONE)
    const startRes = await request(`/api/v1/queue/${token1}/start`, 'PATCH');
    assert(startRes.data.data.status === 'IN_CHAIR', 'Customer 1 transitioned to IN_CHAIR');

    const doneRes = await request(`/api/v1/queue/${token1}/done`, 'PATCH');
    assert(doneRes.data.data.status === 'DONE', 'Customer 1 transitioned to DONE');

    // 12. Refresh Simulation: Querying by Token returns full persisted state
    const refreshedTicket = await request(`/api/v1/queue/status/${token2}`);
    assert(refreshedTicket.status === 200, `Browser refresh simulation for ${token2} successful`);
    assert(refreshedTicket.data.data.customerName === 'Rohit Sharma', 'Customer name preserved across fetch');
    assert(refreshedTicket.data.data.services.length === 2, '2 services preserved');

    console.log(`\n======================================================`);
    console.log(`STATUS SCREEN TEST SUMMARY: ${passes} Passed, ${failures} Failed`);
    console.log(`======================================================\n`);

    socket.disconnect();
    process.exit(failures > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

runTests();
