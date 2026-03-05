/**
 * CONTENT / VIDEOS TESTS
 * Routes: GET /videos, GET /videos/:videoId,
 *         GET/POST/PUT/DELETE /studio/me/videos/:videoId,
 *         POST /videos/:videoId/view, POST /videos/:videoId/like
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
let createdVideoId;

beforeAll(async () => {
  await connectDB();
  app = getApp();
  ({ token: creatorToken } = await loginCreator(app));

  const { payload } = await registerUser(app, { email: 'video_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// POST /api/v1/videos/upload  (Upload)
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/videos/upload', () => {
  it('201 — creates a video with required fields', async () => {
    const res = await request(app)
      .post('/api/v1/videos/upload')
      .set('Authorization', `Bearer ${creatorToken}`)
      // Use .field() / .attach() for multipart; here we test JSON fallback
      .field('title', 'Restoring a 1984 Macintosh')
      .field('description', 'A deep dive into CRT repairs...')
      .field('visibility', 'public');
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data.status).toBe('ready');
    createdVideoId = res.body.data._id;
  });

  it('400 — rejects missing title', async () => {
    const res = await request(app)
      .post('/api/v1/videos/upload')
      .set('Authorization', `Bearer ${creatorToken}`)
      .field('description', 'No title here')
      .field('visibility', 'public');
    expectError(res, 400);
  });

  it('400 — rejects invalid visibility value', async () => {
    const res = await request(app)
      .post('/api/v1/videos/upload')
      .set('Authorization', `Bearer ${creatorToken}`)
      .field('title', 'Test')
      .field('visibility', 'invisible'); // invalid
    expectError(res, 400);
  });

  it('403 — viewer cannot upload', async () => {
    const res = await request(app)
      .post('/api/v1/videos/upload')
      .set('Authorization', `Bearer ${viewerToken}`)
      .field('title', 'Hack')
      .field('visibility', 'public');
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// GET /api/v1/videos/mine
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/videos/mine', () => {
  it('200 — returns creator video library', async () => {
    const res = await request(app)
      .get('/api/v1/videos/mine')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('200 — filter=drafts only returns drafts', async () => {
    const res = await request(app)
      .get('/api/v1/videos/mine?filter=drafts')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    res.body.data.forEach((v) => {
      expect(['draft', 'processing']).toContain(v.status);
    });
  });

  it('403 — viewer cannot access studio video library', async () => {
    const res = await request(app)
      .get('/api/v1/videos/mine')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// PUT /api/v1/videos/:videoId
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/videos/:videoId', () => {
  it('200 — updates title and visibility', async () => {
    if (!createdVideoId) return;
    const res = await request(app)
      .put(`/api/v1/videos/${createdVideoId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Updated Title', visibility: 'members_only' });
    expectSuccess(res, 200);
    expect(res.body.data.title).toBe('Updated Title');
    expect(res.body.data.visibility).toBe('members_only');
  });

  it('404 — returns 404 for non-existent videoId', async () => {
    const res = await request(app)
      .put('/api/v1/videos/000000000000000000000000')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Ghost' });
    expectError(res, 404);
  });

  it('403 — viewer cannot edit videos', async () => {
    if (!createdVideoId) return;
    const res = await request(app)
      .put(`/api/v1/videos/${createdVideoId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Hacked' });
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /videos  (Public browse)
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/videos', () => {
  it('200 — returns public video list without auth', async () => {
    const res = await request(app).get('/api/v1/videos');
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('200 — supports pagination params', async () => {
    const res = await request(app).get('/api/v1/videos?page=1&limit=5');
    expectSuccess(res, 200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it('200 — no members_only videos in public listing', async () => {
    const res = await request(app).get('/api/v1/videos');
    res.body.data.forEach((v) => {
      expect(v.visibility).not.toBe('members_only');
      expect(v.visibility).not.toBe('private');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// GET /videos/:videoId
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/videos/:videoId', () => {
  it('404 — returns 404 for non-existent video', async () => {
    const res = await request(app).get('/api/v1/videos/000000000000000000000000');
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /videos/:videoId/view
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/videos/:videoId/view', () => {
  it('200 — records a view event', async () => {
    if (!createdVideoId) return;
    const res = await request(app)
      .post(`/api/v1/videos/${createdVideoId}/view`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /videos/:videoId/like
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/videos/:videoId/like', () => {
  it('200 — toggles like on a video', async () => {
    if (!createdVideoId) return;
    const res = await request(app)
      .post(`/api/v1/videos/${createdVideoId}/like`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('liked');
    expect(res.body.data).toHaveProperty('likeCount');
  });

  it('401 — unauthenticated users cannot like', async () => {
    if (!createdVideoId) return;
    const res = await request(app).post(`/api/v1/videos/${createdVideoId}/like`);
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/v1/videos/:videoId
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/videos/:videoId', () => {
  it('200 — deletes a video the creator owns', async () => {
    if (!createdVideoId) return;
    const res = await request(app)
      .delete(`/api/v1/videos/${createdVideoId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — returns 404 when video already deleted', async () => {
    if (!createdVideoId) return;
    const res = await request(app)
      .delete(`/api/v1/videos/${createdVideoId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expectError(res, 404);
  });
});
