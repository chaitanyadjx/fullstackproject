/**
 * STUDIO (CREATOR) TESTS
 * Routes: GET/PUT /studio/me, GET /studio/me/stats,
 *         PUT /studio/me/stream-key, POST /studio/apply
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
let viewerEmail;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  // Creator user
  ({ token: creatorToken } = await loginCreator(app));

  // Regular viewer (no creator role)
  const { payload } = await registerUser(app, { email: 'studio_viewer@test.com' });
  viewerEmail = payload.email;
  viewerToken = await loginUser(app, viewerEmail);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me', () => {
  it('200 — returns station profile for creator', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('bio');
    expect(res.body.data).toHaveProperty('category');
    // Stream key MUST NOT be returned on profile GET
    expect(res.body.data).not.toHaveProperty('streamKey');
  });

  it('403 — blocked for non-creator (viewer)', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get('/api/v1/studio/me');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /studio/me
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/studio/me', () => {
  it('200 — updates station display name and bio', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ displayName: 'RetroTech', bio: 'Restoring vintage computers.', category: 'Technology' });
    expectSuccess(res, 200);
    expect(res.body.data.displayName).toBe('RetroTech');
    expect(res.body.data.bio).toBe('Restoring vintage computers.');
  });

  it('400 — rejects empty displayName', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ displayName: '' });
    expectError(res, 400);
  });

  it('403 — viewer cannot update studio', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ displayName: 'Hacked' });
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me/stats
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me/stats', () => {
  it('200 — returns all expected stat fields', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/stats')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    const d = res.body.data;
    expect(d).toHaveProperty('revenue30d');
    expect(d).toHaveProperty('revenueChange');
    expect(d).toHaveProperty('activeSubscribers');
    expect(d).toHaveProperty('newSubscribers');
    expect(d).toHaveProperty('watchTimeHours');
    expect(d).toHaveProperty('avgRetentionPct');
    expect(d).toHaveProperty('recentUploads');
    expect(Array.isArray(d.recentUploads)).toBe(true);
  });

  it('403 — viewer cannot access studio stats', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/stats')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /studio/me/stream-key
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/studio/me/stream-key', () => {
  it('200 — regenerates and returns new stream key', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/stream-key')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('streamKey');
    expect(typeof res.body.data.streamKey).toBe('string');
    expect(res.body.data.streamKey.length).toBeGreaterThan(10);
  });

  it('403 — viewer cannot regenerate stream key', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/stream-key')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /studio/apply
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/studio/apply', () => {
  it('201 — submits a creator application', async () => {
    const res = await request(app)
      .post('/api/v1/studio/apply')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        stationName: 'ByteSizedCode',
        category: 'Technology',
        portfolioUrl: 'https://portfolio.example.com',
        description: 'Short-form coding tips.',
      });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data.status).toBe('pending');
  });

  it('400 — rejects missing stationName', async () => {
    const res = await request(app)
      .post('/api/v1/studio/apply')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ category: 'Technology' });
    expectError(res, 400);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).post('/api/v1/studio/apply').send({
      stationName: 'X',
      category: 'Y',
    });
    expectError(res, 401);
  });
});
