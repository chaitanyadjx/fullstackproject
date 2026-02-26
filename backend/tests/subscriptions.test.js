/**
 * SUBSCRIPTIONS TESTS
 * Routes: GET /users/me/subscriptions,
 *         POST /subscriptions,
 *         PUT /subscriptions/:id/cancel,
 *         PUT /subscriptions/:id/reactivate,
 *         GET /subscriptions/:id
 */

const request = require('supertest');
const {
  connectDB, cleanup, getApp,
  loginCreator, registerUser, loginUser,
  expectSuccess, expectError,
} = require('./helpers');

let app;
let creatorToken;
let viewerToken;
let tierId;
let subscriptionId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  ({ token: creatorToken } = await loginCreator(app));

  const { payload } = await registerUser(app, { email: 'sub_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);

  // Create a tier to subscribe to
  const tierRes = await request(app)
    .post('/api/v1/studio/me/tiers')
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({
      name: 'Basic',
      price: 3.99,
      currency: 'USD',
      billingPeriod: 'monthly',
      perks: ['Early access'],
    });
  tierId = tierRes.body?.data?._id;
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// POST /subscriptions
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/subscriptions', () => {
  it('201 — creates a new subscription (mock payment)', async () => {
    if (!tierId) return;
    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        tierId,
        paymentMethodId: 'pm_card_visa_test',
      });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('status');
    expect(['active', 'pending']).toContain(res.body.data.status);
    subscriptionId = res.body.data._id;
  });

  it('400 — rejects missing tierId', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ paymentMethodId: 'pm_card_visa_test' });
    expectError(res, 400);
  });

  it('400 — rejects missing paymentMethodId', async () => {
    if (!tierId) return;
    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ tierId });
    expectError(res, 400);
  });

  it('401 — unauthenticated users cannot subscribe', async () => {
    if (!tierId) return;
    const res = await request(app)
      .post('/api/v1/subscriptions')
      .send({ tierId, paymentMethodId: 'pm_card_visa_test' });
    expectError(res, 401);
  });

  it('404 — rejects non-existent tierId', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ tierId: '000000000000000000000000', paymentMethodId: 'pm_x' });
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /users/me/subscriptions
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/users/me/subscriptions', () => {
  it('200 — returns array of viewer subscriptions', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/subscriptions')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get('/api/v1/users/me/subscriptions');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /subscriptions/:id
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/subscriptions/:id', () => {
  it('200 — returns subscription details', async () => {
    if (!subscriptionId) return;
    const res = await request(app)
      .get(`/api/v1/subscriptions/${subscriptionId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data._id).toBe(subscriptionId);
    expect(res.body.data).toHaveProperty('tier');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('renewalDate');
  });

  it('404 — returns 404 for unknown ID', async () => {
    const res = await request(app)
      .get('/api/v1/subscriptions/000000000000000000000000')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /subscriptions/:id/cancel
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/subscriptions/:id/cancel', () => {
  it('200 — cancels an active subscription', async () => {
    if (!subscriptionId) return;
    const res = await request(app)
      .put(`/api/v1/subscriptions/${subscriptionId}/cancel`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data).toHaveProperty('expiresAt');
  });

  it('404 — cancelling non-existent subscription', async () => {
    const res = await request(app)
      .put('/api/v1/subscriptions/000000000000000000000000/cancel')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 404);
  });

  it('401 — unauthenticated cannot cancel', async () => {
    const res = await request(app).put('/api/v1/subscriptions/any/cancel');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /subscriptions/:id/reactivate
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/subscriptions/:id/reactivate', () => {
  it('200 — reactivates a cancelled subscription', async () => {
    if (!subscriptionId) return;
    const res = await request(app)
      .put(`/api/v1/subscriptions/${subscriptionId}/reactivate`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ paymentMethodId: 'pm_card_visa_test' });
    expectSuccess(res, 200);
    expect(['active', 'pending']).toContain(res.body.data.status);
  });

  it('400 — missing paymentMethodId when required', async () => {
    if (!subscriptionId) return;
    const res = await request(app)
      .put(`/api/v1/subscriptions/${subscriptionId}/reactivate`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({});
    expectError(res, 400);
  });
});
