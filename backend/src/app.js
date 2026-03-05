require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const studioRoutes       = require('./routes/studioRoutes');
const videoRoutes        = require('./routes/videoRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const streamRoutes       = require('./routes/streamRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const billingRoutes      = require('./routes/billingRoutes');
const discoveryRoutes    = require('./routes/discoveryRoutes');
const bundleRoutes       = require('./routes/bundleRoutes');
const communityRoutes    = require('./routes/communityRoutes');
const postRoutes         = require('./routes/postRoutes');
const commentRoutes      = require('./routes/commentRoutes');
const perkRoutes         = require('./routes/perkRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// ─── Serve frontend static files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', '..', 'code')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/studio',        studioRoutes);
app.use('/api/v1/videos',        videoRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/streams',       streamRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/billing',       billingRoutes);
app.use('/api/v1/stations',      discoveryRoutes);
app.use('/api/v1/discover',      discoveryRoutes);
app.use('/api/v1/bundles',       bundleRoutes);
app.use('/api/v1/community',     communityRoutes);
app.use('/api/v1/posts',         postRoutes);
app.use('/api/v1/comments',      commentRoutes);
app.use('/api/v1/perks',         perkRoutes);

// ─── API 404 fallback ─────────────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Frontend fallback — serve index.html for any non-API, non-file route ─────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'code', 'index.html'));
});

module.exports = app;

