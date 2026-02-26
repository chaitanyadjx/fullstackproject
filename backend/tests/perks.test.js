/**
 * PERKS TESTS
 * Routes: GET /users/me/perks,
 *         GET/POST/DELETE /studio/me/perks,
 *         POST /perks/:id/claim
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
let perkId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  ({ token: creatorToken } = await loginCreator(app));

  const { payload } = await registerUser(app, { email: 'perks_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// POST /studio/me/perks
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/studio/me/perks', () => {
  it('201 — creator creates a perk', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/perks')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Exclusive Wallpack Vol.1',
        description: 'High-res retro wallpapers.',
        type: 'download',
        downloadUrl: 'https://cdn.verto.example/wallpack1.zip',
        tierRequired: null, // free perk
      });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.title).toBe('Exclusive Wallpack Vol.1');
    perkId = res.body.data._id;
  });

  it('400 — rejects missing title', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/perks')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ type: 'download', downloadUrl: 'https://example.com/file.zip' });
    expectError(res, 400);
  });

  it('400 — rejects missing type', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/perks')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'No Type Perk' });
    expectError(res, 400);
  });

  it('403 — viewer cannot create perks', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/perks')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Hack Perk', type: 'download' });
    expectError(res, 403);
  });

  it('401 — unauthenticated cannot create perks', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/perks')
      .send({ title: 'Ghost', type: 'download' });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me/perks
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me/perks', () => {
  it('200 — returns array of creator perks', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/perks')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('403 — viewer cannot list studio perk management data', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/perks')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /users/me/perks
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/users/me/perks', () => {
  it('200 — returns perks available to the viewer', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/perks')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((p) => {
      expect(p).toHaveProperty('_id');
      expect(p).toHaveProperty('title');
      expect(p).toHaveProperty('type');
      expect(p).toHaveProperty('claimedAt');
    });
  });

  it('401 — unauthenticated cannot list their perks', async () => {
    const res = await request(app).get('/api/v1/users/me/perks');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /perks/:id/claim
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/perks/:id/claim', () => {
  it('200 — viewer claims a free perk', async () => {
    if (!perkId) return;
    const res = await request(app)
      .post(`/api/v1/perks/${perkId}/claim`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('claimedAt');
    // Download perks return a URL
    if (res.body.data.type === 'download') {
      expect(res.body.data).toHaveProperty('downloadUrl');
    }
  });

  it('409 — cannot claim the same perk twice', async () => {
    if (!perkId) return;
    const res = await request(app)
      .post(`/api/v1/perks/${perkId}/claim`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 409);
  });

  it('404 — returns 404 for unknown perk ID', async () => {
    const res = await request(app)
      .post('/api/v1/perks/000000000000000000000000/claim')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 404);
  });

  it('401 — unauthenticated cannot claim perks', async () => {
    if (!perkId) return;
    const res = await request(app).post(`/api/v1/perks/${perkId}/claim`);
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /studio/me/perks/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/studio/me/perks/:id', () => {
  it('200 — creator deletes a perk', async () => {
    if (!perkId) return;
    const res = await request(app)
      .delete(`/api/v1/studio/me/perks/${perkId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — re-deleting already deleted perk', async () => {
    if (!perkId) return;
    const res = await request(app)
      .delete(`/api/v1/studio/me/perks/${perkId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expectError(res, 404);
  });

  it('403 — viewer cannot delete perks', async () => {
    const res = await request(app)
      .delete('/api/v1/studio/me/perks/000000000000000000000000')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});
