/**
 * NOTIFICATIONS TESTS
 * Routes: GET /users/me/notifications,
 *         PUT /users/me/notifications/:id/read,
 *         PUT /users/me/notifications/read-all
 */

const request = require('supertest');
const {
  connectDB, cleanup, getApp,
  registerUser, loginUser,
  expectSuccess, expectError,
} = require('./helpers');

let app;
let token;
let notificationId;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  const { payload } = await registerUser(app, { email: 'notif_user@test.com' });
  token = await loginUser(app, payload.email);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /users/me/notifications
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/users/me/notifications', () => {
  it('200 — returns notifications array', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/notifications')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('notifications');
    expect(res.body.data).toHaveProperty('unreadCount');
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
    expect(typeof res.body.data.unreadCount).toBe('number');
  });

  it('200 — each notification has expected fields', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/notifications')
      .set('Authorization', `Bearer ${token}`);
    res.body.data.notifications.forEach((n) => {
      expect(n).toHaveProperty('_id');
      expect(n).toHaveProperty('type');
      expect(n).toHaveProperty('message');
      expect(n).toHaveProperty('isRead');
      expect(n).toHaveProperty('createdAt');
    });

    // Capture a notification ID if available
    if (res.body.data.notifications.length > 0) {
      notificationId = res.body.data.notifications[0]._id;
    }
  });

  it('200 — supports ?unreadOnly=true filter', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    res.body.data.notifications.forEach((n) => {
      expect(n.isRead).toBe(false);
    });
  });

  it('200 — supports pagination', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/notifications?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data.notifications.length).toBeLessThanOrEqual(10);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get('/api/v1/users/me/notifications');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /users/me/notifications/:id/read
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/users/me/notifications/:id/read', () => {
  it('200 — marks a notification as read', async () => {
    if (!notificationId) return;
    const res = await request(app)
      .put(`/api/v1/users/me/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data.isRead).toBe(true);
  });

  it('404 — returns 404 for unknown notification ID', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/notifications/000000000000000000000000/read')
      .set('Authorization', `Bearer ${token}`);
    expectError(res, 404);
  });

  it('401 — blocked without token', async () => {
    const id = notificationId || '000000000000000000000000';
    const res = await request(app).put(`/api/v1/users/me/notifications/${id}/read`);
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /users/me/notifications/read-all
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/users/me/notifications/read-all', () => {
  it('200 — marks all notifications as read', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('updatedCount');
    expect(typeof res.body.data.updatedCount).toBe('number');
  });

  it('200 — unreadCount is 0 after read-all', async () => {
    await request(app)
      .put('/api/v1/users/me/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/users/me/notifications')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data.unreadCount).toBe(0);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).put('/api/v1/users/me/notifications/read-all');
    expectError(res, 401);
  });
});
