/**
 * Automated End-to-End Verification of Customer Joining Flow
 */
import http from 'http';
import { app } from './src/server.js';

const runTests = async () => {
  console.log('--- Starting Customer Joining Flow Verification ---');
  let failures = 0;
  let passes = 0;

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

  // Wait 1 second for server to initialize
  await new Promise((r) => setTimeout(r, 1000));

  try {
    // 1. Check Live Queue & Salon Status
    const liveRes = await request('/api/v1/queue/live');
    assert(liveRes.status === 200, 'GET /api/v1/queue/live returns 200 OK');
    assert(liveRes.data?.data?.stats !== undefined, 'Live stats payload present');
    assert(liveRes.data?.data?.salonStatus?.isSalonOpen !== undefined, 'Salon opening status present');

    // 2. Check Services Catalog
    const servicesRes = await request('/api/v1/services');
    assert(servicesRes.status === 200, 'GET /api/v1/services returns 200 OK');
    assert(servicesRes.data?.count >= 4, `At least 4 services loaded (Found: ${servicesRes.data?.count})`);
    const service1 = servicesRes.data.data[0];
    const service2 = servicesRes.data.data[1];
    const service3 = servicesRes.data.data[2];
    const service4 = servicesRes.data.data[3];

    // 3. Check Barbers Roster
    const barbersRes = await request('/api/v1/barbers');
    assert(barbersRes.status === 200, 'GET /api/v1/barbers returns 200 OK');
    assert(barbersRes.data?.count >= 3, `At least 3 barbers loaded (Found: ${barbersRes.data?.count})`);
    const onDutyBarber = barbersRes.data.data.find((b) => b.isWorkingToday && !b.isOnBreak);
    const onBreakBarber = barbersRes.data.data.find((b) => b.isOnBreak);
    assert(onDutyBarber !== undefined, `Found active on-duty barber: ${onDutyBarber?.name}`);
    assert(onBreakBarber !== undefined, `Found barber on break: ${onBreakBarber?.name}`);

    // 4. Test Validation: Invalid Name
    const badNameRes = await request('/api/v1/queue/join', 'POST', {
      customerName: 'A',
      customerPhone: '9876543210',
      serviceIds: [service1._id],
    });
    assert(badNameRes.status === 400, 'Rejects customer name shorter than 2 characters (400 Bad Request)');

    // 5. Test Validation: Invalid Phone
    const badPhoneRes = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Deepak Patel',
      customerPhone: '12345',
      serviceIds: [service1._id],
    });
    assert(badPhoneRes.status === 400, 'Rejects invalid phone number format (400 Bad Request)');

    // 6. Test Validation: 0 Services
    const zeroServiceRes = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Deepak Patel',
      customerPhone: '9876543210',
      serviceIds: [],
    });
    assert(zeroServiceRes.status === 400, 'Rejects join with 0 services (400 Bad Request)');

    // 7. Test Validation: > 3 Services (Max 3 rule)
    const fourServiceRes = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Deepak Patel',
      customerPhone: '9876543210',
      serviceIds: [service1._id, service2._id, service3._id, service4._id],
    });
    assert(fourServiceRes.status === 400, 'Rejects join with >3 services (400 Bad Request)');

    // 8. Successful Customer Join (Any Barber)
    const validJoin1 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Deepak Patel',
      customerPhone: '9876543210',
      serviceIds: [service1._id, service2._id],
      preferredBarberId: null,
    });
    assert(validJoin1.status === 201, 'Successful join returns 201 Created');
    assert(validJoin1.data?.data?.tokenNumber?.startsWith('A-'), `Token generated with A- prefix: ${validJoin1.data?.data?.tokenNumber}`);
    assert(validJoin1.data?.data?.totalPrice === service1.price + service2.price, `Total price calculated accurately (₹${validJoin1.data?.data?.totalPrice})`);
    assert(validJoin1.data?.data?.totalDuration === service1.duration + service2.duration, `Total duration calculated accurately (${validJoin1.data?.data?.totalDuration} mins)`);

    // 9. Phone Number Uniqueness Enforcement (409 Conflict)
    const duplicateJoin = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Deepak Patel Duplicate',
      customerPhone: '9876543210',
      serviceIds: [service1._id],
    });
    assert(duplicateJoin.status === 409, 'Rejects duplicate active phone with 409 Conflict');
    assert(duplicateJoin.data?.existingTicket !== undefined, 'Returns existing active ticket in 409 conflict payload');

    // 10. Successful Customer Join with Specific Barber
    const validJoin2 = await request('/api/v1/queue/join', 'POST', {
      customerName: 'Sanjay Shah',
      customerPhone: '9876543211',
      serviceIds: [service1._id],
      preferredBarberId: onDutyBarber._id,
    });
    assert(validJoin2.status === 201, 'Customer 2 join with specific barber returns 201 Created');
    assert(validJoin2.data?.data?.preferredBarberId === onDutyBarber._id, 'Preferred barber correctly recorded');

    // 11. Retrieve Ticket Status via /status/:id
    const token1 = validJoin1.data?.data?.tokenNumber;
    const statusRes = await request(`/api/v1/queue/status/${token1}`);
    assert(statusRes.status === 200, `GET /api/v1/queue/status/${token1} returns 200 OK`);
    assert(statusRes.data?.data?.customerName === 'Deepak Patel', 'Ticket customer name matches');
    assert(statusRes.data?.data?.status === 'WAITING', 'Initial ticket status is WAITING');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passes} Passed, ${failures} Failed`);
    console.log(`========================================\n`);

    process.exit(failures > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
