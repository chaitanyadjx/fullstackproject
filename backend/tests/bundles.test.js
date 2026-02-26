/**
 * BUNDLES TESTS
 * Routes: GET /bundles, GET /bundles/:id,
 *         POST/PUT/DELETE /bundles (admin),
 *         POST /subscriptions/bundle
 */

const request = require('supertest');
const {
  connectDB, cleanup, getApp,
  loginAdmin, registerUser, loginUser,
  expectSuccess, expectError,
} = require('./helpers');

let app;
let adminToken;
let viewerToken;
let bundleId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  ({ token: adminToken } = await loginAdmin(app));

  const { payload } = await registerUser(app, { email: 'bundle_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// POST /bundles  (Admin only)
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/bundles', () => {
  it('201 — admin creates a bundle', async () => {
    const res = await request(app)
      .post('/api/v1/bundles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tech Bundle',
        description: '5 top technology stations.',
        price: 9.99,
        billingPeriod: 'monthly',
        stationIds: [],
      });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.name).toBe('Tech Bundle');
    bundleId = res.body.data._id;
  });

  it('400 — rejects missing name', async () => {
    const res = await request(app)
      .post('/api/v1/bundles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 9.99, billingPeriod: 'monthly', stationIds: [] });
    expectError(res, 400);
  });

  it('403 — viewer cannot create bundles', async () => {
    const res = await request(app)
      .post('/api/v1/bundles')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Hack Bundle', price: 1, billingPeriod: 'monthly', stationIds: [] });
    expectError(res, 403);
  });

  it('401 — unauthenticated cannot create bundles', async () => {
    const res = await request(app)
      .post('/api/v1/bundles')
      .send({ name: 'X', price: 1, billingPeriod: 'monthly', stationIds: [] });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /bundles
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/bundles', () => {
  it('200 — public can list bundles without auth', async () => {
    const res = await request(app).get('/api/v1/bundles');
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('200 — only active bundles are returned in public listing', async () => {
    const res = await request(app).get('/api/v1/bundles');
    res.body.data.forEach((b) => {
      expect(b).not.toHaveProperty('isActive', false);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// GET /bundles/:id
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/bundles/:id', () => {
  it('200 — returns bundle with stations list', async () => {
    if (!bundleId) return;
    const res = await request(app).get(`/api/v1/bundles/${bundleId}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('price');
    expect(res.body.data).toHaveProperty('stations');
    expect(Array.isArray(res.body.data.stations)).toBe(true);
  });

  it('404 — returns 404 for unknown bundle ID', async () => {
    const res = await request(app).get('/api/v1/bundles/000000000000000000000000');
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /bundles/:id  (Admin only)
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/bundles/:id', () => {
  it('200 — admin updates bundle name and price', async () => {
    if (!bundleId) return;
    const res = await request(app)
      .put(`/api/v1/bundles/${bundleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Premium Tech Bundle', price: 12.99 });
    expectSuccess(res, 200);
    expect(res.body.data.name).toBe('Premium Tech Bundle');
    expect(res.body.data.price).toBe(12.99);
  });

  it('403 — viewer cannot update bundles', async () => {
    if (!bundleId) return;
    const res = await request(app)
      .put(`/api/v1/bundles/${bundleId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Hacked' });
    expectError(res, 403);
  });

  it('404 — returns 404 for unknown bundle ID', async () => {
    const res = await request(app)
      .put('/api/v1/bundles/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' });
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /subscriptions/bundle
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/subscriptions/bundle', () => {
  it('201 or 400 — subscribes to a bundle', async () => {
    if (!bundleId) return;
    const res = await request(app)
      .post('/api/v1/subscriptions/bundle')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ bundleId, paymentMethodId: 'pm_card_visa_test' });
    expect([201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.data).toHaveProperty('bundleId');
      expect(res.body.data).toHaveProperty('status');
    }
  });

  it('400 — rejects missing bundleId', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions/bundle')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ paymentMethodId: 'pm_card_visa_test' });
    expectError(res, 400);
  });

  it('401 — unauthenticated cannot subscribe to bundle', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions/bundle')
      .send({ bundleId: '000000000000000000000000', paymentMethodId: 'pm_x' });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /bundles/:id  (Admin only)
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/bundles/:id', () => {
  it('200 — admin deletes a bundle', async () => {
    if (!bundleId) return;
    const res = await request(app)
      .delete(`/api/v1/bundles/${bundleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — re-deleting already deleted bundle', async () => {
    if (!bundleId) return;
    const res = await request(app)
      .delete(`/api/v1/bundles/${bundleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expectError(res, 404);
  });
});
