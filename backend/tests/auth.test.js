/**
 * AUTH TESTS
 * Routes: POST /auth/register, /auth/login, /auth/logout,
 *         /auth/forgot-password, /auth/reset-password,
 *         /auth/verify-email, /auth/resend-verification, GET /auth/me
 */

const request = require('supertest');
const { connectDB, cleanup, getApp, expectSuccess, expectError } = require('./helpers');

let app;

beforeAll(async () => {
  await connectDB();
  app = getApp();
});

afterAll(async () => {
  await cleanup();
});

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  const endpoint = '/api/v1/auth/register';

  it('201 — creates a new user with valid data', async () => {
    const res = await request(app).post(endpoint).send({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Min8chars!',
    });
    expectSuccess(res, 201);
    expect(res.body.data).toHaveProperty('userId');
    expect(res.body.message).toMatch(/verify/i);
  });

  it('400 — rejects missing fullName', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'nofullname@test.com',
      password: 'Min8chars!',
    });
    expectError(res, 400);
  });

  it('400 — rejects invalid email format', async () => {
    const res = await request(app).post(endpoint).send({
      fullName: 'Test',
      email: 'not-an-email',
      password: 'Min8chars!',
    });
    expectError(res, 400);
  });

  it('400 — rejects password shorter than 8 characters', async () => {
    const res = await request(app).post(endpoint).send({
      fullName: 'Test',
      email: 'shortpass@test.com',
      password: '123',
    });
    expectError(res, 400);
  });

  it('409 — rejects duplicate email', async () => {
    await request(app).post(endpoint).send({
      fullName: 'First',
      email: 'duplicate@test.com',
      password: 'Min8chars!',
    });
    const res = await request(app).post(endpoint).send({
      fullName: 'Second',
      email: 'duplicate@test.com',
      password: 'Min8chars!',
    });
    expectError(res, 409);
  });

  it('does NOT return passwordHash in response', async () => {
    const res = await request(app).post(endpoint).send({
      fullName: 'Safe',
      email: 'nosecret@test.com',
      password: 'Min8chars!',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(JSON.stringify(res.body)).not.toMatch(/password/);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  const endpoint = '/api/v1/auth/login';
  const creds = { email: 'login_test@test.com', password: 'Min8chars!' };

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Login Test',
      ...creds,
    });
  });

  it('200 — returns accessToken and refreshToken', async () => {
    const res = await request(app).post(endpoint).send(creds);
    expectSuccess(res, 200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data).toHaveProperty('user');
  });

  it('200 — user object contains expected fields', async () => {
    const res = await request(app).post(endpoint).send(creds);
    const { user } = res.body.data;
    expect(user).toHaveProperty('_id');
    expect(user).toHaveProperty('fullName');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role');
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('401 — rejects wrong password', async () => {
    const res = await request(app).post(endpoint).send({
      email: creds.email,
      password: 'WrongPassword!',
    });
    expectError(res, 401);
  });

  it('401 — rejects non-existent email', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'ghost@nowhere.com',
      password: 'Min8chars!',
    });
    expectError(res, 401);
  });

  it('400 — rejects missing password field', async () => {
    const res = await request(app).post(endpoint).send({ email: creds.email });
    expectError(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  const endpoint = '/api/v1/auth/me';
  let token;

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Me Test',
      email: 'me_test@test.com',
      password: 'Min8chars!',
    });
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'me_test@test.com',
      password: 'Min8chars!',
    });
    token = res.body.data.accessToken;
  });

  it('200 — returns current user when token is valid', async () => {
    const res = await request(app)
      .get(endpoint)
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
    expect(res.body.data.email).toBe('me_test@test.com');
  });

  it('401 — rejects request with no token', async () => {
    const res = await request(app).get(endpoint);
    expectError(res, 401);
  });

  it('401 — rejects malformed token', async () => {
    const res = await request(app)
      .get(endpoint)
      .set('Authorization', 'Bearer this.is.garbage');
    expectError(res, 401);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /auth/forgot-password
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/forgot-password', () => {
  const endpoint = '/api/v1/auth/forgot-password';

  it('200 — succeeds for a registered email', async () => {
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Forgot',
      email: 'forgot@test.com',
      password: 'Min8chars!',
    });
    const res = await request(app).post(endpoint).send({ email: 'forgot@test.com' });
    expectSuccess(res, 200);
    // Should NOT reveal whether email exists (security)
    expect(res.body.message).toMatch(/sent/i);
  });

  it('200 — same generic response for unknown email (no enumeration)', async () => {
    const res = await request(app).post(endpoint).send({ email: 'ghost@nowhere.com' });
    // Must return 200 regardless to prevent user enumeration attacks
    expect(res.statusCode).toBe(200);
  });

  it('400 — rejects missing email field', async () => {
    const res = await request(app).post(endpoint).send({});
    expectError(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /auth/reset-password
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/reset-password', () => {
  const endpoint = '/api/v1/auth/reset-password';

  it('400 — rejects missing token', async () => {
    const res = await request(app).post(endpoint).send({
      newPassword: 'NewPass123!',
      confirmPassword: 'NewPass123!',
    });
    expectError(res, 400);
  });

  it('400 — rejects when passwords do not match', async () => {
    const res = await request(app).post(endpoint).send({
      token: 'some-token',
      newPassword: 'NewPass123!',
      confirmPassword: 'DifferentPass123!',
    });
    expectError(res, 400);
  });

  it('400 — rejects invalid/expired token', async () => {
    const res = await request(app).post(endpoint).send({
      token: 'invalid-expired-token',
      newPassword: 'NewPass123!',
      confirmPassword: 'NewPass123!',
    });
    expectError(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/logout', () => {
  let token;

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Logout Test',
      email: 'logout@test.com',
      password: 'Min8chars!',
    });
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'logout@test.com',
      password: 'Min8chars!',
    });
    token = res.body.data.accessToken;
  });

  it('200 — successfully logs out with valid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expectSuccess(res, 200);
  });

  it('401 — rejects logout without token', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expectError(res, 401);
  });
});
