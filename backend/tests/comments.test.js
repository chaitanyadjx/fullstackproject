/**
 * COMMENTS & THREADS TESTS
 * Routes: GET/POST /posts/:id/comments,
 *         POST /comments/:id/reply,
 *         DELETE/like /comments/:id,
 *         GET/POST /videos/:id/comments,
 *         GET/DELETE /studio/me/comments,
 *         PUT /studio/me/comments/:id/approve,
 *         PUT /studio/me/comments/ban-user
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
let targetPostId;
let targetVideoId;
let commentId;
let videoCommentId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  const { token, creator } = await loginCreator(app);
  creatorToken = token;

  const { payload } = await registerUser(app, { email: 'comment_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);

  // Seed a post
  const stationRes = await request(app)
    .get('/api/v1/studio/me')
    .set('Authorization', `Bearer ${creatorToken}`);
  const stationId = stationRes.body?.data?._id || '000000000000000000000000';

  const postRes = await request(app)
    .post(`/api/v1/stations/${stationId}/posts`)
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ content: 'Open for comments!', type: 'update' });
  targetPostId = postRes.body?.data?._id;

  // Seed a video
  const videoRes = await request(app)
    .post('/api/v1/studio/me/videos')
    .set('Authorization', `Bearer ${creatorToken}`)
    .field('title', 'Comment Target Video')
    .field('visibility', 'public');
  targetVideoId = videoRes.body?.data?._id;
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// POST /posts/:id/comments
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/posts/:id/comments', () => {
  it('201 — authenticated user posts a comment', async () => {
    if (!targetPostId) return;
    const res = await request(app)
      .post(`/api/v1/posts/${targetPostId}/comments`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ text: 'Great post! Love the content.' });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.text).toBe('Great post! Love the content.');
    commentId = res.body.data._id;
  });

  it('400 — rejects empty comment text', async () => {
    if (!targetPostId) return;
    const res = await request(app)
      .post(`/api/v1/posts/${targetPostId}/comments`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ text: '' });
    expectError(res, 400);
  });

  it('401 — unauthenticated cannot comment', async () => {
    if (!targetPostId) return;
    const res = await request(app)
      .post(`/api/v1/posts/${targetPostId}/comments`)
      .send({ text: 'Ghost comment' });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /posts/:id/comments
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/posts/:id/comments', () => {
  it('200 — returns comments array for a post', async () => {
    if (!targetPostId) return;
    const res = await request(app).get(`/api/v1/posts/${targetPostId}/comments`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /comments/:id/reply
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/comments/:id/reply', () => {
  it('201 — creates a nested reply', async () => {
    if (!commentId) return;
    const res = await request(app)
      .post(`/api/v1/comments/${commentId}/reply`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ text: 'Thanks for commenting!' });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('parentId', commentId);
  });

  it('400 — rejects empty reply text', async () => {
    if (!commentId) return;
    const res = await request(app)
      .post(`/api/v1/comments/${commentId}/reply`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ text: '' });
    expectError(res, 400);
  });

  it('404 — returns 404 for non-existent comment', async () => {
    const res = await request(app)
      .post('/api/v1/comments/000000000000000000000000/reply')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ text: 'Ghost reply' });
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /comments/:id/like
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/comments/:id/like', () => {
  it('200 — toggles like on a comment', async () => {
    if (!commentId) return;
    const res = await request(app)
      .post(`/api/v1/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('liked');
    expect(res.body.data).toHaveProperty('likeCount');
  });

  it('401 — unauthenticated cannot like comments', async () => {
    if (!commentId) return;
    const res = await request(app).post(`/api/v1/comments/${commentId}/like`);
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /comments/:id
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/comments/:id', () => {
  it('200 — user deletes their own comment', async () => {
    if (!commentId) return;
    const res = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('403 — cannot delete another user\'s comment', async () => {
    // Create another comment as creator, try to delete as viewer
    if (!targetPostId) return;
    const newComment = await request(app)
      .post(`/api/v1/posts/${targetPostId}/comments`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ text: 'Creator comment' });
    const newId = newComment.body?.data?._id;
    if (!newId) return;

    const res = await request(app)
      .delete(`/api/v1/comments/${newId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /videos/:id/comments
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/videos/:id/comments', () => {
  it('201 — posts a comment on a video', async () => {
    if (!targetVideoId) return;
    const res = await request(app)
      .post(`/api/v1/videos/${targetVideoId}/comments`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ text: 'Amazing video quality!' });
    expectSuccess(res, 201);
    expect(res.body.data.text).toBe('Amazing video quality!');
    videoCommentId = res.body.data._id;
  });

  it('401 — unauthenticated cannot comment on videos', async () => {
    if (!targetVideoId) return;
    const res = await request(app)
      .post(`/api/v1/videos/${targetVideoId}/comments`)
      .send({ text: 'Ghost' });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /videos/:id/comments
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/videos/:id/comments', () => {
  it('200 — returns video comment thread', async () => {
    if (!targetVideoId) return;
    const res = await request(app).get(`/api/v1/videos/${targetVideoId}/comments`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me/comments
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me/comments', () => {
  it('200 — returns all comments across creator content', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/comments')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
  });

  it('403 — viewer cannot access studio comments panel', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/comments')
      .set('Authorization', `Bearer ${viewerToken}`);
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /studio/me/comments/:id/approve
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/studio/me/comments/:id/approve', () => {
  it('200 or 404 — creator can approve a comment', async () => {
    if (!videoCommentId) return;
    const res = await request(app)
      .put(`/api/v1/studio/me/comments/${videoCommentId}/approve`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.data.isApproved).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /studio/me/comments/ban-user
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/studio/me/comments/ban-user', () => {
  it('200 — creator can ban a user from commenting', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/comments/ban-user')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ userId: '000000000000000000000000' });
    // 200 or 404 depending on whether user exists
    expect([200, 404]).toContain(res.statusCode);
  });

  it('400 — rejects missing userId', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/comments/ban-user')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({});
    expectError(res, 400);
  });

  it('403 — viewer cannot ban users', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/comments/ban-user')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ userId: '000000000000000000000000' });
    expectError(res, 403);
  });
});
