/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js',
  setupFilesAfterFramework: [],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
};
