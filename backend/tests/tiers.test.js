/**
 * TIERS TESTS
 * Routes: GET /stations/:stationId/tiers,
 *         GET/POST/PUT/DELETE /studio/me/tiers/:tierId,
 *         PUT /studio/me/tiers/active
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
let createdTierId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  const { token, creator } = await loginCreator(app);
  creatorToken = token;

  const { payload } = await registerUser(app, { email: 'tier_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// POST /studio/me/tiers
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/studio/me/tiers', () => {
  it('201 — creates a new subscription tier', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/tiers')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        name: 'Supporter',
        price: 4.99,
        currency: 'USD',
        billingPeriod: 'monthly',
        perks: ['Ad-free experience', 'Early access videos'],
        color: '#F5E642',
      });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('name', 'Supporter');
    expect(res.body.data.price).toBe(4.99);
    createdTierId = res.body.data._id;
  });

  it('400 — rejects missing price', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/tiers')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ name: 'No Price Tier', billingPeriod: 'monthly' });
    expectError(res, 400);
  });

  it('400 — rejects price of zero or less', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/tiers')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ name: 'Free', price: 0, billingPeriod: 'monthly' });
    expectError(res, 400);
  });

  it('403 — viewer cannot create tiers', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/tiers')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Hack', price: 1.00, billingPeriod: 'monthly' });
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me/tiers
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me/tiers', () => {
  it('200 — returns array of creator tiers', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/tiers')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('403 — viewer cannot list private tier settings', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/tiers')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /stations/:stationId/tiers  (Public)
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/stations/:stationId/tiers', () => {
  it('200 or 404 — returns public tiers for a station', async () => {
    const res = await request(app).get('/api/v1/stations/000000000000000000000000/tiers');
    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
      // Public tiers must not expose internal fields
      res.body.data.forEach((tier) => {
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('price');
        expect(tier).not.toHaveProperty('stripeProductId');
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /studio/me/tiers/:tierId
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/studio/me/tiers/:tierId', () => {
  it('200 — updates tier name and perks', async () => {
    if (!createdTierId) return;
    const res = await request(app)
      .put(`/api/v1/studio/me/tiers/${createdTierId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ name: 'Superfan', perks: ['Ad-free', 'Monthly wallpacks'] });
    expectSuccess(res, 200);
    expect(res.body.data.name).toBe('Superfan');
  });

  it('403 — viewer cannot update tiers', async () => {
    if (!createdTierId) return;
    const res = await request(app)
      .put(`/api/v1/studio/me/tiers/${createdTierId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Hacked' });
    expectError(res, 403);
  });

  it('404 — returns 404 for non-existent tier', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/tiers/000000000000000000000000')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ name: 'Ghost' });
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /studio/me/tiers/active
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/studio/me/tiers/active', () => {
  it('200 — sets active tiers list', async () => {
    if (!createdTierId) return;
    const res = await request(app)
      .put('/api/v1/studio/me/tiers/active')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ tierIds: [createdTierId] });
    expectSuccess(res, 200);
  });

  it('400 — rejects non-array tierIds', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/tiers/active')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ tierIds: createdTierId }); // string, not array
    expectError(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /studio/me/tiers/:tierId
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/studio/me/tiers/:tierId', () => {
  it('200 — deletes the tier', async () => {
    if (!createdTierId) return;
    const res = await request(app)
      .delete(`/api/v1/studio/me/tiers/${createdTierId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — deleting already-deleted tier returns 404', async () => {
    if (!createdTierId) return;
    const res = await request(app)
      .delete(`/api/v1/studio/me/tiers/${createdTierId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expectError(res, 404);
  });
});
