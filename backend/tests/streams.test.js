/**
 * LIVE STREAMS & SCHEDULE TESTS
 * Routes: GET /streams/live, GET /streams/:id,
 *         GET/POST/PUT/DELETE /studio/me/schedule,
 *         POST /streams/:id/chat, GET /streams/:id/chat
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
let scheduleEntryId;

beforeAll(async () => {
  await connectDB();
  app = getApp();
  ({ token: creatorToken } = await loginCreator(app));

  const { payload } = await registerUser(app, { email: 'stream_viewer@test.com' });
  viewerToken = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /streams/live
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/streams/live', () => {
  it('200 — returns array of currently live streams', async () => {
    const res = await request(app).get('/api/v1/streams/live');
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('200 — each item has expected fields', async () => {
    const res = await request(app).get('/api/v1/streams/live');
    res.body.data.forEach((stream) => {
      expect(stream).toHaveProperty('_id');
      expect(stream).toHaveProperty('title');
      expect(stream).toHaveProperty('viewerCount');
      expect(stream).toHaveProperty('currentlyLive', true);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// GET /streams/:id
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/streams/:id', () => {
  it('404 — returns 404 for unknown stream ID', async () => {
    const res = await request(app).get('/api/v1/streams/000000000000000000000000');
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /studio/me/schedule  (Create scheduled stream)
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/studio/me/schedule', () => {
  it('201 — creates a scheduled stream entry', async () => {
    const streamTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    const res = await request(app)
      .post('/api/v1/studio/me/schedule')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Live Retro Repair Session',
        scheduledAt: streamTime,
        category: 'Technology',
        description: 'Fixing a broken Amiga 500.',
      });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('title', 'Live Retro Repair Session');
    scheduleEntryId = res.body.data._id;
  });

  it('400 — rejects missing title', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/schedule')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ scheduledAt: new Date(Date.now() + 3600000).toISOString() });
    expectError(res, 400);
  });

  it('400 — rejects past scheduledAt', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/schedule')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Past Stream',
        scheduledAt: new Date('2020-01-01').toISOString(),
      });
    expectError(res, 400);
  });

  it('403 — viewer cannot create schedule entries', async () => {
    const res = await request(app)
      .post('/api/v1/studio/me/schedule')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Hack Attempt', scheduledAt: new Date(Date.now() + 3600000).toISOString() });
    expectError(res, 403);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /studio/me/schedule
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/studio/me/schedule', () => {
  it('200 — returns list of scheduled streams', async () => {
    const res = await request(app)
      .get('/api/v1/studio/me/schedule')
      .set('Authorization', `Bearer ${creatorToken}`);
    expectSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /studio/me/schedule/:scheduleId
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/studio/me/schedule/:scheduleId', () => {
  it('200 — updates a scheduled stream', async () => {
    if (!scheduleEntryId) return;
    const res = await request(app)
      .put(`/api/v1/studio/me/schedule/${scheduleEntryId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Updated Stream Title', category: 'Gaming' });
    expectSuccess(res, 200);
    expect(res.body.data.title).toBe('Updated Stream Title');
  });

  it('404 — returns 404 for non-existent schedule entry', async () => {
    const res = await request(app)
      .put('/api/v1/studio/me/schedule/000000000000000000000000')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Ghost' });
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /studio/me/schedule/:scheduleId
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/studio/me/schedule/:scheduleId', () => {
  it('200 — deletes a scheduled stream', async () => {
    if (!scheduleEntryId) return;
    const res = await request(app)
      .delete(`/api/v1/studio/me/schedule/${scheduleEntryId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect([200, 204]).toContain(res.statusCode);
  });

  it('404 — returns 404 when entry already deleted', async () => {
    if (!scheduleEntryId) return;
    const res = await request(app)
      .delete(`/api/v1/studio/me/schedule/${scheduleEntryId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expectError(res, 404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /streams/:id/chat
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/streams/:id/chat', () => {
  it('401 — unauthenticated users cannot chat', async () => {
    const res = await request(app)
      .post('/api/v1/streams/000000000000000000000000/chat')
      .send({ message: 'Hello' });
    expectError(res, 401);
  });

  it('400 — rejects empty message', async () => {
    const res = await request(app)
      .post('/api/v1/streams/000000000000000000000000/chat')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ message: '' });
    expectError(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /streams/:id/chat
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/streams/:id/chat', () => {
  it('200 or 404 — returns chat history array if stream exists', async () => {
    const res = await request(app).get('/api/v1/streams/000000000000000000000000/chat');
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
    } else {
      expect(res.statusCode).toBe(404);
    }
  });
});
