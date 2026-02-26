/**
 * Shared test helpers
 * Import these in every test file for DRY setup.
 *
 * Usage:
 *   const { getApp, cleanup, registerUser, loginUser, loginAdmin } = require('./helpers');
 */

const mongoose = require('mongoose');
const request = require('supertest');

// ─── DB lifecycle ─────────────────────────────────────────────────────────────

/** Connect to the in-memory DB (call in beforeAll) */
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
}

/** Drop all collections and disconnect (call in afterAll) */
async function cleanup() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await mongoose.disconnect();
}

// ─── App loader ───────────────────────────────────────────────────────────────

/** Lazy-loads the Express app so env vars are set before requiring */
function getApp() {
  return require('../src/app');
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Register a user and return the response body.
 * @param {object} app  - Supertest app instance
 * @param {object} overrides - Fields to override defaults
 */
async function registerUser(app, overrides = {}) {
  const payload = {
    fullName: 'Test User',
    email: `user_${Date.now()}@test.com`,
    password: 'TestPass123!',
    ...overrides,
  };
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  return { res, payload };
}

/**
 * Login and return the JWT access token.
 */
async function loginUser(app, email, password = 'TestPass123!') {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body?.data?.accessToken;
}

/**
 * Create an admin user and return their token.
 * Requires your User model to support seeding a role directly.
 */
async function loginAdmin(app) {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  const admin = await User.create({
    fullName: 'Admin User',
    email: `admin_${Date.now()}@verto.test`,
    passwordHash: await bcrypt.hash('AdminPass123!', 10),
    role: 'admin',
    isEmailVerified: true,
  });
  const token = await loginUser(app, admin.email, 'AdminPass123!');
  return { token, admin };
}

/**
 * Create a creator user and return their token.
 */
async function loginCreator(app) {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  const creator = await User.create({
    fullName: 'Creator User',
    email: `creator_${Date.now()}@verto.test`,
    passwordHash: await bcrypt.hash('CreatorPass123!', 10),
    role: 'creator',
    isEmailVerified: true,
  });
  const token = await loginUser(app, creator.email, 'CreatorPass123!');
  return { token, creator };
}

// ─── Assertion helpers ────────────────────────────────────────────────────────

/** Assert standard success shape */
function expectSuccess(res, statusCode = 200) {
  expect(res.statusCode).toBe(statusCode);
  expect(res.body.success).toBe(true);
  expect(res.body).toHaveProperty('data');
}

/** Assert standard error shape */
function expectError(res, statusCode) {
  expect(res.statusCode).toBe(statusCode);
  expect(res.body.success).toBe(false);
}

module.exports = {
  connectDB,
  cleanup,
  getApp,
  registerUser,
  loginUser,
  loginAdmin,
  loginCreator,
  expectSuccess,
  expectError,
};
