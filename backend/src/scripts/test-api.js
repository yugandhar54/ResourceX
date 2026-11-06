/**
 * ResourceX – API Integration Test Script
 * Tests every real backend endpoint in sequence.
 * Run: node src/scripts/test-api.js
 *
 * Requires the server to be running on PORT 8080
 * and the database to be seeded.
 */
'use strict';

const BASE = 'http://localhost:8080/api';

let pass = 0, fail = 0;
let studentToken = '';
let adminToken   = '';
let createdResourceId = '';
let reservationId     = '';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${BASE}${path}`, opts);
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS  ${name}`);
    pass++;
  } catch (err) {
    console.log(`  ❌ FAIL  ${name}: ${err.message}`);
    fail++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function run() {
  console.log('\n════════════════════════════════════════');
  console.log('   ResourceX API Integration Tests');
  console.log('════════════════════════════════════════\n');

  /* ── Health ── */
  console.log('[ Health ]');
  await test('GET /health returns ok', async () => {
    const r = await req('GET', '/health');
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(d.status === 'ok', 'Expected status:ok');
  });

  /* ── Auth ── */
  console.log('\n[ Auth ]');
  await test('POST /auth/register – validation rejects missing fields', async () => {
    const r = await req('POST', '/auth/register', { email: 'bad-email' });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test('POST /auth/register – creates a new student', async () => {
    const r = await req('POST', '/auth/register', {
      firstName: 'Test', lastName: 'User', email: `test_${Date.now()}@campus.edu`,
      rollNumber: 'TST001', department: 'Computer Science & Engineering', password: 'Password@123',
    });
    const d = await r.json();
    assert(r.status === 201, `Expected 201, got ${r.status}: ${d.message}`);
    assert(d.token, 'Expected a JWT token');
    assert(d.user.role === 'student', 'Expected role=student');
  });

  await test('POST /auth/login – rejects wrong password', async () => {
    const r = await req('POST', '/auth/login', { email: 'arjun.sharma@campus.edu', password: 'wrong' });
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('POST /auth/login – student succeeds and returns token', async () => {
    const r = await req('POST', '/auth/login', { email: 'arjun.sharma@campus.edu', password: 'Password@123' });
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}: ${d.message}`);
    assert(d.token, 'Expected JWT token');
    studentToken = d.token;
  });

  await test('POST /auth/login – admin succeeds and returns token', async () => {
    const r = await req('POST', '/auth/login', { email: 'admin@campus.edu', password: 'AdminPass@123' });
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    adminToken = d.token;
  });

  await test('GET /auth/me – returns current user from token', async () => {
    const r = await req('GET', '/auth/me', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(d.user.email === 'arjun.sharma@campus.edu', 'Wrong user returned');
  });

  await test('POST /auth/google – rejects missing email', async () => {
    const r = await req('POST', '/auth/google', {});
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test('POST /auth/google – signs in / creates user with Google profile', async () => {
    const testGoogleEmail = `google_user_${Date.now()}@gmail.com`;
    const r = await req('POST', '/auth/google', {
      email: testGoogleEmail,
      name: 'Google Test User',
      googleId: 'g_sub_' + Date.now(),
      picture: 'https://lh3.googleusercontent.com/a/default-user'
    });
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(d.token, 'Expected JWT token from Google Auth');
    assert(d.user.email === testGoogleEmail, 'Expected matching email');
    assert(d.user.authProvider === 'google', 'Expected authProvider=google');
  });

  await test('GET /auth/me – rejects missing token', async () => {
    const r = await req('GET', '/auth/me');
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  /* ── Resources ── */
  console.log('\n[ Resources ]');
  await test('GET /resources – returns paginated list', async () => {
    const r = await req('GET', '/resources');
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(Array.isArray(d.items), 'Expected items array');
    assert(d.total >= 9, `Expected ≥9 resources, got ${d.total}`);
    assert(d.totalPages >= 1, 'Expected at least 1 page');
  });

  await test('GET /resources – filters by category=books', async () => {
    const r = await req('GET', '/resources?category=books');
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    d.items.forEach(item => assert(item.category === 'books', `Wrong category: ${item.category}`));
  });

  await test('GET /resources – searches by keyword', async () => {
    const r = await req('GET', '/resources?search=algorithms');
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(d.total >= 1, 'Expected at least 1 result for "algorithms"');
  });

  await test('GET /resources/:id – returns a single resource', async () => {
    const listRes = await req('GET', '/resources?pageSize=1');
    const list    = await listRes.json();
    const id      = list.items[0].id;
    const r = await req('GET', `/resources/${id}`);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(d.id === id, 'ID mismatch');
    assert(d.owner, 'Expected owner object');
  });

  await test('GET /resources/:id – returns 404 for unknown ID', async () => {
    const r = await req('GET', '/resources/000000000000000000000000');
    assert(r.status === 404, `Expected 404, got ${r.status}`);
  });

  await test('GET /resources/mine – returns only my resources', async () => {
    const r = await req('GET', '/resources/mine', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d), 'Expected an array');
  });

  await test('POST /resources – creates new listing (pending)', async () => {
    const r = await req('POST', '/resources', {
      title: 'Test Listing – API Test', description: 'Auto-generated test resource.',
      category: 'notes', type: 'digital', exchangeMode: 'free', price: 0,
    }, studentToken);
    const d = await r.json();
    assert(r.status === 201, `Expected 201, got ${r.status}: ${d.message}`);
    assert(d.status === 'pending', `Expected pending, got ${d.status}`);
    createdResourceId = d.id;
  });

  await test('PUT /resources/:id – owner can update', async () => {
    const r = await req('PUT', `/resources/${createdResourceId}`, {
      description: 'Updated description.',
    }, studentToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
  });

  await test('DELETE /resources/:id – owner can delete', async () => {
    const r = await req('DELETE', `/resources/${createdResourceId}`, null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(d.success === true, 'Expected success:true');
  });

  /* ── Reviews ── */
  console.log('\n[ Reviews ]');
  await test('GET /resources/:id/reviews – returns review list', async () => {
    const listRes = await req('GET', '/resources?category=books&pageSize=1');
    const list    = await listRes.json();
    const rid     = list.items[0].id;
    const r = await req('GET', `/resources/${rid}/reviews`);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d), 'Expected array of reviews');
  });

  /* ── Reservations ── */
  console.log('\n[ Reservations ]');
  await test('GET /reservations – returns my reservations', async () => {
    const r = await req('GET', '/reservations', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d), 'Expected array');
    assert(d.length >= 1, 'Expected at least 1 reservation for Arjun');
  });

  await test('POST /reservations – creates a reservation request', async () => {
    // Login as keerthi (different from OS book owner)
    const loginR = await req('POST', '/auth/login', { email: 'keerthi.reddy@campus.edu', password: 'Password@123' });
    const loginD = await loginR.json();
    const keerthiToken = loginD.token;

    // Get a resource owned by Meera (not Keerthi)
    const listR = await req('GET', '/resources?category=books');
    const listD = await listR.json();
    const meeraResource = listD.items.find(i => i.ownerName && i.ownerName.includes('Meera'));
    if (!meeraResource) { throw new Error('Could not find Meera resource for test'); }

    const tomorrow  = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek  = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

    const r = await req('POST', '/reservations', {
      resourceId: meeraResource.id,
      startDate:  tomorrow.toISOString(),
      returnDate: nextWeek.toISOString(),
      notes: 'Integration test reservation',
    }, keerthiToken);
    const d = await r.json();
    assert(r.status === 201, `Expected 201, got ${r.status}: ${d.message}`);
    assert(d.status === 'pending', 'Expected pending');
    reservationId = d.id;
  });

  await test('PATCH /reservations/:id – owner can approve', async () => {
    if (!reservationId) throw new Error('No reservation ID from previous test');
    // Owner is Meera
    const loginR = await req('POST', '/auth/login', { email: 'meera.varghese@campus.edu', password: 'Password@123' });
    const meeraToken = (await loginR.json()).token;

    const r = await req('PATCH', `/reservations/${reservationId}`, { status: 'approved' }, meeraToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}: ${d.message}`);
    assert(d.status === 'approved', `Expected approved, got ${d.status}`);
  });

  /* ── Notifications ── */
  console.log('\n[ Notifications ]');
  await test('GET /notifications – returns notifications', async () => {
    const r = await req('GET', '/notifications', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d), 'Expected array');
  });

  await test('POST /notifications/mark-all-read – marks all as read', async () => {
    const r = await req('POST', '/notifications/mark-all-read', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(d.success === true, 'Expected success:true');
  });

  /* ── Requirements ── */
  console.log('\n[ Requirements ]');
  await test('GET /requirements – returns my requirements', async () => {
    const r = await req('GET', '/requirements', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d) && d.length >= 1, 'Expected at least 1 requirement');
  });

  await test('POST /requirements – creates a new requirement', async () => {
    const r = await req('POST', '/requirements', {
      title: 'Test Requirement', description: 'Needs a DBMS book.',
      category: 'books', budget: 500,
    }, studentToken);
    const d = await r.json();
    assert(r.status === 201, `Expected 201, got ${r.status}: ${d.message}`);
  });

  /* ── Wishlist ── */
  console.log('\n[ Wishlist ]');
  let sampleResourceId = '';
  await test('POST /wishlist/toggle – adds resource to wishlist', async () => {
    const listR = await req('GET', '/resources?pageSize=1');
    const listD = await listR.json();
    sampleResourceId = listD.items[0].id;
    const r = await req('POST', '/wishlist/toggle', { resourceId: sampleResourceId }, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(d.wishlisted === true, 'Expected wishlisted=true');
  });

  await test('GET /wishlist – returns user wishlist', async () => {
    const r = await req('GET', '/wishlist', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(Array.isArray(d) && d.some(item => item.id === sampleResourceId), 'Expected wishlisted item in list');
  });

  await test('POST /wishlist/toggle – removes resource from wishlist', async () => {
    const r = await req('POST', '/wishlist/toggle', { resourceId: sampleResourceId }, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(d.wishlisted === false, 'Expected wishlisted=false');
  });

  /* ── Transactions ── */
  console.log('\n[ Transactions ]');
  await test('GET /transactions – returns transaction history', async () => {
    const r = await req('GET', '/transactions', null, studentToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d), 'Expected array');
  });

  /* ── Admin ── */
  console.log('\n[ Admin ]');
  await test('GET /admin/users – returns all users (admin only)', async () => {
    const r = await req('GET', '/admin/users', null, adminToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d) && d.length >= 9, `Expected ≥9 users, got ${d.length}`);
  });

  await test('GET /admin/users – forbidden for student', async () => {
    const r = await req('GET', '/admin/users', null, studentToken);
    assert(r.status === 403, `Expected 403, got ${r.status}`);
  });

  await test('GET /admin/analytics – returns real aggregation data', async () => {
    const r = await req('GET', '/admin/analytics', null, adminToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200`);
    assert(d.totalUsers >= 9, `Expected ≥9 users, got ${d.totalUsers}`);
    assert(d.totalResources >= 9, `Expected ≥9 resources, got ${d.totalResources}`);
    assert(typeof d.resourcesByCategory === 'object', 'Expected resourcesByCategory object');
  });

  await test('GET /admin/resources – returns resources with pending status', async () => {
    let r = await req('GET', '/admin/resources?status=pending', null, adminToken);
    let d = await r.json();
    if (!d.length) {
      // Create a pending listing
      await req('POST', '/resources', {
        title: 'Pending Listing For Moderation',
        description: 'Testing moderation pipeline',
        category: 'books', subject: 'CSE',
        type: 'physical', condition: 'Good',
        exchangeMode: 'borrow', availability: 'available',
        location: 'CS Block',
      }, studentToken);
      r = await req('GET', '/admin/resources?status=pending', null, adminToken);
      d = await r.json();
    }
    assert(r.status === 200, `Expected 200`);
    assert(Array.isArray(d) && d.length >= 1, 'Expected at least 1 pending resource');
  });

  await test('PATCH /admin/resources/:id/moderate – admin can approve', async () => {
    // Find the pending resource
    let listR = await req('GET', '/admin/resources?status=pending', null, adminToken);
    let listD = await listR.json();
    if (!listD.length) {
      await req('POST', '/resources', {
        title: 'Pending Resource For Approval',
        description: 'Auto created for test',
        category: 'books', subject: 'CSE',
        type: 'physical', condition: 'Good',
        exchangeMode: 'borrow', availability: 'available',
        location: 'CS Block',
      }, studentToken);
      listR = await req('GET', '/admin/resources?status=pending', null, adminToken);
      listD = await listR.json();
    }
    const id = listD[0].id;

    const r = await req('PATCH', `/admin/resources/${id}/moderate`, { action: 'approved', note: 'Verified' }, adminToken);
    const d = await r.json();
    assert(r.status === 200, `Expected 200, got ${r.status}: ${d.message}`);
    assert(d.status === 'approved', `Expected approved, got ${d.status}`);
  });

  /* ── Summary ── */
  console.log('\n════════════════════════════════════════');
  console.log(`   Results: ${pass} passed, ${fail} failed`);
  console.log('════════════════════════════════════════\n');

  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
