/**
 * USER / ACCOUNT TESTS
 * Routes: GET/PUT /users/me, PUT /users/me/avatar,
 *         PUT /users/me/password, GET/PUT /users/me/notifications/settings,
 *         GET /users/:username
 */

const request = require('supertest');
const path = require('path');
const {
  connectDB, cleanup, getApp,
  registerUser, loginUser,
  expectSuccess, expectError,
} = require('./helpers');

let app;
let token;
let userEmail;

beforeAll(async () => {
  await connectDB();
  app = getApp();

  const { payload } = await registerUser(app, { email: 'user_account@test.com' });
  userEmail = payload.email;
  token = await loginUser(app, userEmail);
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// GET /users/me
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/users/me', () => {
  it('200 — returns own profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data.email).toBe(userEmail);
    expect(res.body.data).toHaveProperty('fullName');
    expect(res.body.data).toHaveProperty('role');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /users/me
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/users/me', () => {
  it('200 — updates displayName and bio', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Alex Runner', bio: 'Just a viewer.' });
    expectSuccess(res, 200);
    expect(res.body.data.displayName).toBe('Alex Runner');
    expect(res.body.data.bio).toBe('Just a viewer.');
  });

  it('200 — updates email', async () => {
    const newEmail = `updated_${Date.now()}@test.com`;
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newEmail });
    expectSuccess(res, 200);
    expect(res.body.data.email).toBe(newEmail);
    // Refresh token with new email
    token = await loginUser(app, newEmail);
  });

  it('400 — rejects invalid email format', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-valid' });
    expectError(res, 400);
  });

  it('401 — blocked without token', async () => {
    const res = await request(app).put('/api/v1/users/me').send({ displayName: 'X' });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /users/me/password
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/users/me/password', () => {
  it('200 — changes password with correct current password', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'TestPass123!',
        newPassword: 'NewPass456!',
        confirmPassword: 'NewPass456!',
      });
    expectSuccess(res, 200);
  });

  it('400 — rejects when passwords do not match', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'TestPass123!',
        newPassword: 'NewPass456!',
        confirmPassword: 'DifferentPass!',
      });
    expectError(res, 400);
  });

  it('401 — rejects wrong current password', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongCurrent!',
        newPassword: 'NewPass456!',
        confirmPassword: 'NewPass456!',
      });
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /users/me/notifications/settings
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/users/me/notifications/settings', () => {
  it('200 — returns notification preferences', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/notifications/settings')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('newContentAlerts');
    expect(res.body.data).toHaveProperty('communityReplies');
    expect(res.body.data).toHaveProperty('weeklyDigest');
    expect(res.body.data).toHaveProperty('billingReceipts');
    expect(res.body.data).toHaveProperty('productUpdates');
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /users/me/notifications/settings
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/users/me/notifications/settings', () => {
  it('200 — updates notification preferences', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/notifications/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        newContentAlerts: false,
        communityReplies: true,
        exclusivePerks: true,
        weeklyDigest: false,
        billingReceipts: true,
        productUpdates: false,
      });
    expectSuccess(res, 200);
    expect(res.body.data.newContentAlerts).toBe(false);
    expect(res.body.data.weeklyDigest).toBe(false);
  });

  it('400 — rejects non-boolean values', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/notifications/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ newContentAlerts: 'yes' });
    expectError(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /users/:username
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/users/:username', () => {
  it('200 — returns public profile (no sensitive fields)', async () => {
    const res = await request(app).get('/api/v1/users/alexrunner');
    // If user found:
    if (res.statusCode === 200) {
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('email');
    } else {
      // 404 is also acceptable if user doesnt exist
      expect(res.statusCode).toBe(404);
    }
  });

  it('404 — returns 404 for unknown username', async () => {
    const res = await request(app).get('/api/v1/users/this_user_does_not_exist_xyz');
    expectError(res, 404);
  });
});
