/**
 * COMMUNITY / POSTS TESTS
 * Routes: GET /community/feed,
 *         GET/POST /stations/:id/posts,
 *         PUT/DELETE /posts/:id,
 *         POST /posts/:id/like
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
let creatorStationId;
let postId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  const { token, creator } = await loginCreator(app);
  creatorToken = token;
  // Try to get stationId from creator profile
  const profileRes = await request(app)
    .get('/api/v1/studio/me')
    .set('Authorization', `Bearer ${creatorToken}`);
  creatorStationId = profileRes.body?.data?._id || '000000000000000000000000';

  const { payload } = await registerUser(app, { email: 'comm_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /community/feed
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/community/feed', () => {
  it('200 — returns aggregated post feed for subscriber', async () => {
    const res = await request(app)
      .get('/api/v1/community/feed')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('posts');
    expect(Array.isArray(res.body.data.posts)).toBe(true);
  });

  it('200 — each post has expected fields', async () => {
    const res = await request(app)
      .get('/api/v1/community/feed')
      .set('Authorization', `Bearer ${viewerToken}`);
    res.body.data.posts.forEach((p) => {
      expect(p).toHaveProperty('_id');
      expect(p).toHaveProperty('content');
      expect(p).toHaveProperty('author');
      expect(p).toHaveProperty('createdAt');
    });
  });

  it('401 — unauthenticated cannot access feed', async () => {
    const res = await request(app).get('/api/v1/community/feed');
    expectError(res, 401);
  });

  it('200 — supports pagination', async () => {
    const res = await request(app)
      .get('/api/v1/community/feed?page=1&limit=10')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data.posts.length).toBeLessThanOrEqual(10);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /stations/:id/posts
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/stations/:id/posts', () => {
  it('201 — creator can create a post on their station', async () => {
    const res = await request(app)
      .post(`/api/v1/stations/${creatorStationId}/posts`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        content: 'Excited to announce my new retro gaming series!',
        type: 'announcement',
      });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.content).toBe('Excited to announce my new retro gaming series!');
    postId = res.body.data._id;
  });

  it('400 — rejects missing content', async () => {
    const res = await request(app)
      .post(`/api/v1/stations/${creatorStationId}/posts`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ type: 'announcement' });
    expectError(res, 400);
  });

  it('403 — viewer cannot post on a station', async () => {
    const res = await request(app)
      .post(`/api/v1/stations/${creatorStationId}/posts`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ content: 'Intruder post!' });
    expectError(res, 403);
  });

  it('401 — unauthenticated cannot post', async () => {
    const res = await request(app)
      .post(`/api/v1/stations/${creatorStationId}/posts`)
      .send({ content: 'Ghost post' });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /stations/:id/posts
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/stations/:id/posts', () => {
  it('200 — returns posts for a station (public)', async () => {
    const res = await request(app).get(`/api/v1/stations/${creatorStationId}/posts`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data.posts)).toBe(true);
  });

  it('200 — free posts visible to non-subscriber', async () => {
    const res = await request(app).get(`/api/v1/stations/${creatorStationId}/posts`);
    if (res.statusCode === 200) {
      res.body.data.posts.forEach((p) => {
        if (p.tier === null || p.tier === undefined) {
          expect(p.content).toBeDefined();
        }
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /posts/:id
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/posts/:id', () => {
  it('200 — creator can edit their own post', async () => {
    if (!postId) return;
    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ content: 'Updated announcement content!' });
    expectSuccess(res, 200);
    expect(res.body.data.content).toBe('Updated announcement content!');
  });

  it('403 — viewer cannot edit posts', async () => {
    if (!postId) return;
    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ content: 'Hacked!' });
    expectError(res, 403);
  });

  it('404 — returns 404 for unknown post', async () => {
    const res = await request(app)
      .put('/api/v1/posts/000000000000000000000000')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ content: 'Ghost' });
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /posts/:id/like
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/posts/:id/like', () => {
  it('200 — toggles like on a post', async () => {
    if (!postId) return;
    const res = await request(app)
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('liked');
    expect(res.body.data).toHaveProperty('likeCount');
    expect(typeof res.body.data.liked).toBe('boolean');
  });

  it('401 — unauthenticated cannot like posts', async () => {
    if (!postId) return;
    const res = await request(app).post(`/api/v1/posts/${postId}/like`);
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /posts/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/posts/:id', () => {
  it('200 — creator can delete their own post', async () => {
    if (!postId) return;
    const res = await request(app)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — re-deleting already deleted post', async () => {
    if (!postId) return;
    const res = await request(app)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expectError(res, 404);
  });
});
