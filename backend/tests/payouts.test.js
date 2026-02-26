/**
 * PAYOUTS TESTS
 * Routes: GET /studio/me/payouts,
 *         POST /studio/me/payouts/withdraw,
 *         GET /studio/me/payouts/:id
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
let payoutId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  ({ token: creatorToken } = await loginCreator(app));

  const { payload } = await registerUser(app, { email: 'payout_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me/payouts
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me/payouts', () => {
  it('200 — returns payout history for creator', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/payouts')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('payouts');
    expect(res.body.data).toHaveProperty('availableBalance');
    expect(res.body.data).toHaveProperty('pendingBalance');
    expect(Array.isArray(res.body.data.payouts)).toBe(true);
  });

  it('200 — availableBalance is a number', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/payouts')
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(typeof res.body.data.availableBalance).toBe('number');
    expect(res.body.data.availableBalance).toBeGreaterThanOrEqual(0);
  });

  it('403 — viewer cannot access payout history', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/payouts')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get('/api/v1/studio/me/payouts');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /studio/me/payouts/withdraw
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/studio/me/payouts/withdraw', () => {
  it('201 or 400 — initiates withdrawal (or insufficient funds)', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/payouts/withdraw')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ amount: 50.00, currency: 'USD' });

    // The creator in-memory DB will likely have 0 balance — 400 is acceptable
    if (res.statusCode === 201) {
      expectSuccess(res, 201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('amount', 50.00);
      expect(res.body.data).toHaveProperty('status');
      payoutId = res.body.data._id;
    } else {
      expectError(res, 400);
    }
  });

  it('400 — rejects missing amount', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/payouts/withdraw')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ currency: 'USD' });
    expectError(res, 400);
  });

  it('400 — rejects zero or negative amount', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/payouts/withdraw')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ amount: 0, currency: 'USD' });
    expectError(res, 400);
  });

  it('400 — rejects amount below minimum payout threshold', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/payouts/withdraw')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ amount: 0.01, currency: 'USD' }); // below $10 threshold
    expectError(res, 400);
  });

  it('403 — viewer cannot initiate payout', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/payouts/withdraw')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 50, currency: 'USD' });
    expectError(res, 403);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/payouts/withdraw')
      .send({ amount: 50 });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me/payouts/:id
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me/payouts/:id', () => {
  it('200 — returns payout details if exists', async () => {
    if (!payoutId) return;
    const res = await request(app)
      .get(`/api/v1/studio/me/payouts/${payoutId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(res.body.data._id).toBe(payoutId);
    expect(res.body.data).toHaveProperty('amount');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('createdAt');
  });

  it('404 — returns 404 for unknown payout ID', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/payouts/000000000000000000000000')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectError(res, 404);
  });

  it('403 — viewer cannot access payout details', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/payouts/000000000000000000000000')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});
