/**
 * Global Test Setup
 * Starts an in-memory MongoDB instance so tests never touch your real DB.
 * Requires: npm install --save-dev mongodb-memory-server
 *
 * Each test file imports helpers from this file via `require('./helpers')`.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Expose URI to all test processes via env variable
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test_jwt_secret_verto_2026';
  process.env.JWT_EXPIRES_IN = '1d';
  process.env.NODE_ENV = 'test';

  // Store instance reference for teardown
  global.__MONGOD__ = mongod;
};
