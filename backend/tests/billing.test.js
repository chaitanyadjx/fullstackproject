/**
 * BILLING / PAYMENTS TESTS
 * Routes: GET /billing/transactions,
 *         GET /billing/transactions/:id/invoice,
 *         GET/POST/DELETE /billing/payment-methods,
 *         PUT /billing/payment-methods/:id/primary
 */

const request = require('supertest');
const {
  connectDB, cleanup, getApp,
  registerUser, loginUser,
  expectSuccess, expectError,
} = require('./helpers');

let app;
let token;
let paymentMethodId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  const { payload } = await registerUser(app, { email: 'billing_user@test.com' });
  token = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /billing/transactions
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/billing/transactions', () => {
  it('200 — returns transactions array', async () => {
    const res = await request(app)
      .get('/api/v1/billing/transactions')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('transactions');
    expect(res.body.data).toHaveProperty('total');
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
  });

  it('200 — each transaction has expected fields', async () => {
    const res = await request(app)
      .get('/api/v1/billing/transactions')
      .set('Authorization', `Bearer ${token}`);
    res.body.data.transactions.forEach((t) => {
      expect(t).toHaveProperty('_id');
      expect(t).toHaveProperty('amount');
      expect(t).toHaveProperty('currency');
      expect(t).toHaveProperty('status');
      expect(t).toHaveProperty('createdAt');
    });
  });

  it('200 — supports ?from and ?to date filtering', async () => {
    const from = '2024-01-01';
    const to = '2025-12-31';
    const res = await request(app)
      .get(`/api/v1/billing/transactions?from=${from}&to=${to}`)
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
  });

  it('200 — supports pagination', async () => {
    const res = await request(app)
      .get('/api/v1/billing/transactions?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data.transactions.length).toBeLessThanOrEqual(5);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get('/api/v1/billing/transactions');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /billing/transactions/:id/invoice
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/billing/transactions/:id/invoice', () => {
  it('404 — returns 404 for unknown transaction ID', async () => {
    const res = await request(app)
      .get('/api/v1/billing/transactions/000000000000000000000000/invoice')
      .set('Authorization', `Bearer ${token}`);
    expectError(res, 404);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get(
      '/api/v1/billing/transactions/000000000000000000000000/invoice'
    );
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /billing/payment-methods
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/billing/payment-methods', () => {
  it('201 — adds a payment method via Stripe PM ID', async () => {
    const res = await request(app)
      .post('/api/v1/billing/payment-methods')
      .set('Authorization', `Bearer ${token}`)
      .send({ stripePaymentMethodId: 'pm_card_visa' });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('brand');
    expect(res.body.data).toHaveProperty('last4');
    expect(res.body.data).toHaveProperty('expiryMonth');
    expect(res.body.data).toHaveProperty('expiryYear');
    // Full card number must NEVER be returned
    expect(JSON.stringify(res.body.data)).not.toMatch(/cardNumber/);
    paymentMethodId = res.body.data._id;
  });

  it('400 — rejects missing stripePaymentMethodId', async () => {
    const res = await request(app)
      .post('/api/v1/billing/payment-methods')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expectError(res, 400);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app)
      .post('/api/v1/billing/payment-methods')
      .send({ stripePaymentMethodId: 'pm_card_visa' });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /billing/payment-methods
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/billing/payment-methods', () => {
  it('200 — returns list of saved payment methods', async () => {
    const res = await request(app)
      .get('/api/v1/billing/payment-methods')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('200 — payment methods never include full card number', async () => {
    const res = await request(app)
      .get('/api/v1/billing/payment-methods')
      .set('Authorization', `Bearer ${token}`);
    res.body.data.forEach((pm) => {
      expect(pm).toHaveProperty('last4');
      expect(pm).not.toHaveProperty('cardNumber');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /billing/payment-methods/:id/primary
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/billing/payment-methods/:id/primary', () => {
  it('200 — sets a payment method as primary', async () => {
    if (!paymentMethodId) return;
    const res = await request(app)
      .put(`/api/v1/billing/payment-methods/${paymentMethodId}/primary`)
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data.isPrimary).toBe(true);
  });

  it('404 — returns 404 for unknown payment method', async () => {
    const res = await request(app)
      .put('/api/v1/billing/payment-methods/000000000000000000000000/primary')
      .set('Authorization', `Bearer ${token}`);
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /billing/payment-methods/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/billing/payment-methods/:id', () => {
  it('200 — deletes a payment method', async () => {
    if (!paymentMethodId) return;
    const res = await request(app)
      .delete(`/api/v1/billing/payment-methods/${paymentMethodId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — re-deleting payment method returns 404', async () => {
    if (!paymentMethodId) return;
    const res = await request(app)
      .delete(`/api/v1/billing/payment-methods/${paymentMethodId}`)
      .set('Authorization', `Bearer ${token}`);
    expectError(res, 404);
  });
});
