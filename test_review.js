const http = require('http');

function req(method, path, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': '1234', ...extraHeaders }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function runTests() {
  const results = [];
  const log = (key, pass, detail) => {
    const s = pass ? 'PASS' : 'FAIL';
    results.push({ key, s, detail });
    console.log(`[${s}] ${key}: ${detail}`);
  };

  // Health
  const health = await req('GET', '/api/health');
  log('00_HEALTH', health.status === 200, `status=${health.body.status}`);

  // Services
  const services = await req('GET', '/api/v1/services');
  log('01_GET_SERVICES', services.status === 200 && services.body.count > 0, `count=${services.body.count}`);
  const svcId = services.body.data?.[0]?._id;
  const svcId2 = services.body.data?.[1]?._id;

  // Barbers
  const barbers = await req('GET', '/api/v1/barbers');
  log('02_GET_BARBERS', barbers.status === 200 && barbers.body.count > 0, `count=${barbers.body.count}`);
  const barberId = barbers.body.data?.[0]?._id;
  const barberSlug = barbers.body.data?.[0]?.slug;

  // TEST 1: Customer joining
  const join1 = await req('POST', '/api/v1/queue/join', {
    customerName: 'Test Alpha',
    customerPhone: '9876543210',
    serviceIds: [svcId],
    preferredBarberId: null,
    entryType: 'ONLINE'
  });
  log('03_CUSTOMER_JOIN', join1.status === 201 && join1.body.data?.tokenNumber, `token=${join1.body.data?.tokenNumber} status=${join1.status}`);
  const ticketId = join1.body.data?._id;
  const tokenNumber = join1.body.data?.tokenNumber;

  // TEST 2: Duplicate phone prevention
  const join2 = await req('POST', '/api/v1/queue/join', {
    customerName: 'Test Alpha',
    customerPhone: '9876543210',
    serviceIds: [svcId],
    entryType: 'ONLINE'
  });
  log('04_DUPLICATE_PHONE', join2.status === 409, `status=${join2.status} msg=${join2.body.message?.substring(0,50)}`);

  // TEST 3: Token generation format
  const join3 = await req('POST', '/api/v1/queue/join', {
    customerName: 'Test Beta',
    customerPhone: '9876500001',
    serviceIds: [svcId, svcId2].filter(Boolean),
    preferredBarberId: null,
    entryType: 'ONLINE'
  });
  log('05_TOKEN_FORMAT', join3.status === 201 && /^[AW]-\d+$/.test(join3.body.data?.tokenNumber), `token=${join3.body.data?.tokenNumber}`);
  const ticketB = join3.body.data?._id;

  // TEST 4: Barber preference
  const join4 = await req('POST', '/api/v1/queue/join', {
    customerName: 'Barber Pref',
    customerPhone: '9900001111',
    serviceIds: [svcId],
    preferredBarberId: barberId,
    entryType: 'ONLINE'
  });
  log('06_BARBER_PREF', join4.status === 201 && String(join4.body.data?.preferredBarberId) === String(barberId), `prefBarber=${join4.body.data?.preferredBarberId}`);

  // TEST 5: Call Next
  const callNext = await req('POST', '/api/v1/barbers/' + barberId + '/call-next');
  log('07_CALL_NEXT', callNext.status === 200 && callNext.body.data?.customer?.tokenNumber, `called=${callNext.body.data?.customer?.tokenNumber} barber=${callNext.body.data?.barber?.name}`);

  // Check barber preference respected: the called token should be the preferred one (join4) or earliest eligible
  const calledToken = callNext.body.data?.customer?.tokenNumber;
  const calledBarberId = String(callNext.body.data?.barber?._id);
  log('08_BARBER_AFFINITY', calledBarberId === String(barberId), `assignedBarber matches called barber: ${calledBarberId}`);

  // TEST 10: Barber break
  const breakOn = await req('PATCH', '/api/v1/barbers/' + barberId + '/break');
  log('09_BREAK_TOGGLE', breakOn.status === 200 && breakOn.body.data?.isOnBreak === true, `isOnBreak=${breakOn.body.data?.isOnBreak}`);

  // Call next while on break should fail
  const callBreakFail = await req('POST', '/api/v1/barbers/' + barberId + '/call-next');
  log('10_BREAK_BLOCKS_CALL', callBreakFail.status === 400, `status=${callBreakFail.status} msg=${callBreakFail.body.message?.substring(0,40)}`);

  // Restore break
  await req('PATCH', '/api/v1/barbers/' + barberId + '/break');

  // TEST 7: Start service
  const calledTicketId = callNext.body.data?.customer?._id;
  if (calledTicketId) {
    const start = await req('PATCH', '/api/v1/queue/' + calledTicketId + '/start');
    log('11_START_SERVICE', start.status === 200 && start.body.data?.status === 'IN_CHAIR', `status=${start.body.data?.status}`);

    // TEST 7: Done
    const done = await req('PATCH', '/api/v1/queue/' + calledTicketId + '/done');
    log('12_DONE', done.status === 200 && done.body.data?.status === 'DONE', `status=${done.body.data?.status}`);
  } else {
    log('11_START_SERVICE', false, 'no calledTicketId');
    log('12_DONE', false, 'no calledTicketId');
  }

  // TEST 9: Cancellation
  const cancel = await req('PATCH', '/api/v1/queue/' + ticketId + '/cancel');
  log('13_CANCEL', cancel.status === 200 && cancel.body.data?.status === 'CANCELLED', `status=${cancel.body.data?.status}`);

  // TEST 8: No-show - need to call someone then mark no-show
  const join5 = await req('POST', '/api/v1/queue/join', {
    customerName: 'NoShow Test',
    customerPhone: '9000011111',
    serviceIds: [svcId],
    entryType: 'ONLINE'
  });
  const callForNS = await req('POST', '/api/v1/barbers/' + barberId + '/call-next');
  if (callForNS.status === 200) {
    const nsId = callForNS.body.data?.customer?._id;
    const noshow = await req('PATCH', '/api/v1/queue/' + nsId + '/no-show');
    log('14_NO_SHOW', noshow.status === 200 && noshow.body.data?.status === 'NO_SHOW', `status=${noshow.body.data?.status}`);
  } else {
    log('14_NO_SHOW', false, `call-next failed: ${callForNS.status} ${JSON.stringify(callForNS.body).substring(0,60)}`);
  }

  // TEST 11: EWT in status
  const statusRes = await req('GET', '/api/v1/queue/status/' + ticketB);
  log('15_EWT', statusRes.status === 200 && statusRes.body.data?.estimatedWaitMinutes !== undefined, `ewt=${statusRes.body.data?.estimatedWaitMinutes} pos=${statusRes.body.data?.position}`);

  // TEST 17: Role-based auth
  const unprotected = await new Promise((resolve, reject) => {
    const opts = { hostname:'localhost', port:5000, path:'/api/v1/admin/settings', method:'PATCH', headers:{'Content-Type':'application/json'} };
    const r = http.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve({status:res.statusCode,body:JSON.parse(d)})}catch(e){resolve({status:res.statusCode,body:d})} }); });
    r.on('error', reject);
    r.write(JSON.stringify({salonName:'HACKED'}));
    r.end();
  });
  log('16_AUTH_NO_PIN_BLOCKED', unprotected.status === 401, `status=${unprotected.status}`);

  const wrongPin = await req('PATCH', '/api/v1/admin/settings', {salonName:'HACKED'}, {'x-admin-pin':'WRONG'});
  log('17_AUTH_WRONG_PIN_BLOCKED', wrongPin.status === 401, `status=${wrongPin.status}`);

  // Test settings read (public)
  const settings = await req('GET', '/api/v1/admin/settings');
  log('18_SETTINGS_READ', settings.status === 200 && settings.body.data?.openingTime, `opening=${settings.body.data?.openingTime} closing=${settings.body.data?.closingTime}`);

  // Test settings update (protected)
  const settingsUpdate = await req('PATCH', '/api/v1/admin/settings', { salonName: 'Elite Salon' });
  log('19_SETTINGS_UPDATE', settingsUpdate.status === 200, `status=${settingsUpdate.status}`);

  // Test service toggle
  const toggleSvc = await req('PATCH', '/api/v1/services/' + svcId + '/toggle');
  const isNowDisabled = toggleSvc.body.data?.isActive === false;
  // Verify disabled service not returned in public list
  const publicServices = await req('GET', '/api/v1/services', null, {});
  const hiddenFromPublic = !publicServices.body.data?.find(s => String(s._id) === String(svcId));
  log('20_SERVICE_TOGGLE_DISABLE', toggleSvc.status === 200 && isNowDisabled, `isActive=${toggleSvc.body.data?.isActive}`);
  log('21_DISABLED_SVC_HIDDEN', hiddenFromPublic, `hiddenFromPublic=${hiddenFromPublic} totalPublic=${publicServices.body.count}`);
  // Re-enable
  await req('PATCH', '/api/v1/services/' + svcId + '/toggle');

  // Test close online queue
  const closeQueue = await req('PATCH', '/api/v1/admin/settings', { isOnlineQueueOpen: false });
  const joinClosed = await req('POST', '/api/v1/queue/join', {
    customerName: 'Should Fail',
    customerPhone: '7000099999',
    serviceIds: [svcId],
    entryType: 'ONLINE'
  });
  log('22_CLOSE_ONLINE_QUEUE', joinClosed.status === 403, `status=${joinClosed.status} code=${joinClosed.body.code}`);
  // walkin should still work
  const walkinClosed = await req('POST', '/api/v1/queue/walkin', {
    customerName: 'WalkIn OK',
    customerPhone: '7000088888',
    serviceIds: [svcId],
  });
  log('23_WALKIN_WHEN_CLOSED', walkinClosed.status === 201, `status=${walkinClosed.status} token=${walkinClosed.body.data?.tokenNumber}`);
  // Reopen
  await req('PATCH', '/api/v1/admin/settings', { isOnlineQueueOpen: true });

  // Test reception board data
  const board = await req('GET', '/api/v1/queue/reception');
  log('24_RECEPTION_BOARD', board.status === 200 && Array.isArray(board.body.data?.barbers), `waiting=${board.body.data?.waiting?.length} barbers=${board.body.data?.barbers?.length}`);

  // Test display data
  const display = await req('GET', '/api/v1/queue/display');
  log('25_DISPLAY_DATA', display.status === 200 && Array.isArray(display.body.data?.stations), `stations=${display.body.data?.stations?.length} nextFive=${display.body.data?.nextFiveTokens?.length}`);

  // Test getTodayAnalytics via admin
  const analytics = await req('GET', '/api/v1/admin/analytics/today');
  log('26_ANALYTICS', analytics.status === 200 && analytics.body.data?.totalJoined !== undefined, `joined=${analytics.body.data?.totalJoined} served=${analytics.body.data?.totalServed} noshow=${analytics.body.data?.totalNoShow}`);

  // DB persistence check - fetch the walkin token from before
  const walkinToken = walkinClosed.body.data?.tokenNumber;
  if (walkinToken) {
    const persist = await req('GET', '/api/v1/queue/status/' + walkinToken);
    log('27_DB_PERSIST', persist.status === 200 && persist.body.data?.tokenNumber === walkinToken, `found=${persist.body.data?.tokenNumber}`);
  }

  console.log('\n=== SUMMARY ===');
  const failed = results.filter(r => r.s === 'FAIL');
  console.log('PASSED:', results.filter(r => r.s === 'PASS').length);
  console.log('FAILED:', failed.length);
  if (failed.length > 0) {
    console.log('FAILURES:');
    failed.forEach(f => console.log('  -', f.key, f.detail));
  }
}

runTests().catch(e => {
  console.error('FATAL TEST ERROR:', e.message);
  console.error(e.stack);
});
