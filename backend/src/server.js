require('dotenv').config();
const mongoose    = require('mongoose');
const app         = require('./app');


const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/verto';

async function start() {
  try {
    // ── 1. MongoDB (users, stations, creator applications) ──────────────────
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    // ── 2. (PostgreSQL removed) ───────────────────────────────────────────────

    // ── 3. HTTP server ───────────────────────────────────────────────────────
    app.listen(PORT, () => console.log(`Verto API running on port ${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

start();
