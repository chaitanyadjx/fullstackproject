// Global teardown — stops the in-memory MongoDB after all tests finish
module.exports = async () => {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
