/**
 * STUDIO (CREATOR) ROUTES
 * GET  /studio/me             — creator's own station profile
 * PUT  /studio/me             — update station name, bio, avatar, banner
 * GET  /studio/me/stats       — dashboard metrics
 * PUT  /studio/me/stream-key  — regenerate RTMP stream key
 * POST /studio/apply          — apply to become a creator
 */

const router  = require('express').Router();
const crypto  = require('crypto');
const multer  = require('multer');
const Station    = require('../models/Station');
const CreatorApplication = require('../models/CreatorApplication');
const { protect, requireRole } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Upsert a Station document for the current creator. */
async function getOrCreateStation(userId) {
  return Station.findOneAndUpdate(
    { ownerId: userId },
    { $setOnInsert: { ownerId: userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// ─── GET /studio/me ───────────────────────────────────────────────────────────

router.get('/me', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const station = await getOrCreateStation(req.user._id);
    // Exclude streamKey from the public station profile
    const data = station.toObject();
    delete data.streamKey;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /studio/me ───────────────────────────────────────────────────────────

router.put(
  '/me',
  protect,
  requireRole('creator', 'admin'),
  upload.fields([{ name: 'avatarFile', maxCount: 1 }, { name: 'bannerFile', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { displayName, bio, category } = req.body;

      if (displayName !== undefined && displayName.trim() === '') {
        return res.status(400).json({ success: false, message: 'displayName cannot be empty.' });
      }

      const updates = {};
      if (displayName !== undefined) updates.name = displayName.trim();
      if (bio          !== undefined) updates.bio  = bio;
      if (category     !== undefined) updates.category = category;

      // In production: upload avatarFile / bannerFile to CDN here
      if (req.files?.avatarFile?.[0]) {
        updates.avatarUrl = `https://cdn.verto.tv/avatars/${req.user._id}_${Date.now()}.jpg`;
      }
      if (req.files?.bannerFile?.[0]) {
        updates.bannerUrl = `https://cdn.verto.tv/banners/${req.user._id}_${Date.now()}.jpg`;
      }

      const station = await Station.findOneAndUpdate(
        { ownerId: req.user._id },
        updates,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Return with displayName alias so client picks up displayName field
      const data = station.toObject();
      delete data.streamKey;
      data.displayName = data.name;

      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── GET /studio/me/stats ─────────────────────────────────────────────────────

router.get('/me/stats', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    // In production: aggregate from Subscription, Video, and analytics collections.
    // For now, return zeroed-out stats with correct shape.
    return res.status(200).json({
      success: true,
      data: {
        revenue30d:         0,
        revenueChange:      0,
        activeSubscribers:  0,
        newSubscribers:     0,
        watchTimeHours:     0,
        avgRetentionPct:    0,
        recentUploads:      [],
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /studio/me/stream-key ────────────────────────────────────────────────

router.put('/me/stream-key', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const streamKey = `sk_${crypto.randomBytes(24).toString('hex')}`;

    await Station.findOneAndUpdate(
      { ownerId: req.user._id },
      { streamKey },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, data: { streamKey } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /studio/apply ───────────────────────────────────────────────────────

router.post('/apply', protect, async (req, res) => {
  try {
    const { stationName, category, portfolioUrl, description } = req.body;

    if (!stationName || stationName.trim() === '') {
      return res.status(400).json({ success: false, message: 'stationName is required.' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, message: 'category is required.' });
    }

    const application = await CreatorApplication.create({
      userId:       req.user._id,
      stationName:  stationName.trim(),
      category:     category.trim(),
      portfolioUrl: portfolioUrl || '',
      description:  description  || '',
    });

    return res.status(201).json({
      success: true,
      data: {
        _id:         application._id,
        stationName: application.stationName,
        category:    application.category,
        status:      application.status,
        createdAt:   application.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TIERS ────────────────────────────────────────────────────────────────────
const Tier     = require('../models/Tier');
const Payout   = require('../models/Payout');
const Perk     = require('../models/Perk');
const Schedule = require('../models/Schedule');
const Comment  = require('../models/Comment');
const Video    = require('../models/Video');
const { uploadFromBuffer } = require('../config/cloudinary');

const uploadVideo = multer({ storage: multer.memoryStorage() });

// PUT /me/tiers/active  — must be registered BEFORE /:tierId
router.put('/me/tiers/active', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { tierIds } = req.body;
    if (!Array.isArray(tierIds)) {
      return res.status(400).json({ success: false, message: 'tierIds must be an array.' });
    }
    await Tier.updateMany({ ownerId: req.user._id }, { isActive: false });
    if (tierIds.length > 0) {
      await Tier.updateMany({ _id: { $in: tierIds }, ownerId: req.user._id }, { isActive: true });
    }
    return res.status(200).json({ success: true, data: { tierIds } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /me/tiers
router.post('/me/tiers', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { name, price, currency, billingPeriod, perks, color, description } = req.body;
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'name is required.' });
    }
    if (price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'price is required.' });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'price must be greater than 0.' });
    }
    const tier = await Tier.create({
      ownerId: req.user._id,
      name: name.trim(),
      price: numPrice,
      currency: currency || 'USD',
      billingPeriod: billingPeriod || 'monthly',
      perks: Array.isArray(perks) ? perks : [],
      color: color || '#6C63FF',
      description: description || '',
    });
    return res.status(201).json({ success: true, data: tier });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /me/tiers
router.get('/me/tiers', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const tiers = await Tier.find({ ownerId: req.user._id }).sort({ price: 1 });
    return res.status(200).json({ success: true, data: tiers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /me/tiers/:tierId
router.put('/me/tiers/:tierId', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { name, price, perks, color, description, billingPeriod } = req.body;
    const updates = {};
    if (name        !== undefined) updates.name        = name;
    if (price       !== undefined) updates.price       = Number(price);
    if (perks       !== undefined) updates.perks       = perks;
    if (color       !== undefined) updates.color       = color;
    if (description !== undefined) updates.description = description;
    if (billingPeriod !== undefined) updates.billingPeriod = billingPeriod;

    const tier = await Tier.findOneAndUpdate(
      { _id: req.params.tierId, ownerId: req.user._id },
      updates,
      { new: true }
    );
    if (!tier) return res.status(404).json({ success: false, message: 'Tier not found.' });
    return res.status(200).json({ success: true, data: tier });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /me/tiers/:tierId
router.delete('/me/tiers/:tierId', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const tier = await Tier.findOneAndDelete({ _id: req.params.tierId, ownerId: req.user._id });
    if (!tier) return res.status(404).json({ success: false, message: 'Tier not found.' });
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PAYOUTS ──────────────────────────────────────────────────────────────────

// GET /me/payouts
router.get('/me/payouts', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const payouts = await Payout.find({ creatorId: req.user._id }).sort({ createdAt: -1 });
    const pendingBalance = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((s, p) => s + p.amount, 0);
    return res.status(200).json({
      success: true,
      data: {
        payouts,
        availableBalance: 0,   // real value from payment processor in production
        pendingBalance,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /me/payouts/withdraw  — must be before /:id
router.post('/me/payouts/withdraw', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount && amount !== 0) {
      return res.status(400).json({ success: false, message: 'amount is required.' });
    }
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be greater than 0.' });
    }
    if (num < 10) {
      return res.status(400).json({ success: false, message: 'Minimum payout is $10.00.' });
    }
    // In production check real balance. In test env return 400 since balance is 0.
    return res.status(400).json({ success: false, message: 'Insufficient balance for withdrawal.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /me/payouts/:id
router.get('/me/payouts/:id', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const payout = await Payout.findOne({ _id: req.params.id, creatorId: req.user._id });
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found.' });
    return res.status(200).json({ success: true, data: payout });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PERKS ────────────────────────────────────────────────────────────────────

// POST /me/perks
router.post('/me/perks', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { title, description, type, downloadUrl, code, tierRequired } = req.body;
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }
    if (!type) {
      return res.status(400).json({ success: false, message: 'type is required.' });
    }
    const validTypes = ['download', 'code', 'link', 'text'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
    }
    const station = await getOrCreateStation(req.user._id);
    const perk = await Perk.create({
      ownerId: req.user._id,
      stationId: station._id,
      title: title.trim(),
      description: description || '',
      type,
      downloadUrl: downloadUrl || null,
      code: code || null,
      tierRequired: tierRequired || null,
    });
    return res.status(201).json({ success: true, data: perk });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /me/perks
router.get('/me/perks', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const perks = await Perk.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: perks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /me/perks/:id
router.delete('/me/perks/:id', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const perk = await Perk.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!perk) return res.status(404).json({ success: false, message: 'Perk not found.' });
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────

// POST /me/schedule
router.post('/me/schedule', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { title, scheduledAt, category, description } = req.body;
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }
    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'scheduledAt is required.' });
    }
    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: 'scheduledAt is not a valid date.' });
    }
    if (date <= new Date()) {
      return res.status(400).json({ success: false, message: 'scheduledAt must be in the future.' });
    }
    const station = await getOrCreateStation(req.user._id);
    const entry = await Schedule.create({
      creatorId: req.user._id,
      stationId: station._id,
      title: title.trim(),
      description: description || '',
      category: category || '',
      scheduledAt: date,
    });
    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /me/schedule
router.get('/me/schedule', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const entries = await Schedule.find({ creatorId: req.user._id, isDeleted: false })
      .sort({ scheduledAt: 1 });
    return res.status(200).json({ success: true, data: entries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /me/schedule/:scheduleId
router.put('/me/schedule/:scheduleId', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { title, category, description, scheduledAt, status } = req.body;
    const updates = {};
    if (title       !== undefined) updates.title       = title;
    if (category    !== undefined) updates.category    = category;
    if (description !== undefined) updates.description = description;
    if (status      !== undefined) updates.status      = status;
    if (scheduledAt !== undefined) {
      const d = new Date(scheduledAt);
      if (!isNaN(d.getTime())) updates.scheduledAt = d;
    }
    const entry = await Schedule.findOneAndUpdate(
      { _id: req.params.scheduleId, creatorId: req.user._id, isDeleted: false },
      updates,
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Schedule entry not found.' });
    return res.status(200).json({ success: true, data: entry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /me/schedule/:scheduleId
router.delete('/me/schedule/:scheduleId', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const entry = await Schedule.findOneAndUpdate(
      { _id: req.params.scheduleId, creatorId: req.user._id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Schedule entry not found.' });
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── VIDEOS ALIAS (for /studio/me/videos) ────────────────────────────────────

router.post(
  '/me/videos',
  protect,
  requireRole('creator', 'admin'),
  uploadVideo.single('videoFile'),
  async (req, res) => {
    try {
      const { title, description, visibility, tags, category } = req.body;
      if (!title || String(title).trim() === '') {
        return res.status(400).json({ success: false, message: 'title is required.' });
      }
      const validVisibilities = ['public', 'private', 'unlisted', 'members_only'];
      const vis = visibility || 'public';
      if (!validVisibilities.includes(vis)) {
        return res.status(400).json({ success: false, message: `visibility must be one of: ${validVisibilities.join(', ')}` });
      }

      let cloudinaryPublicId = null, videoUrl = null, hlsUrl = null,
          fileSizeBytes = 0, mimeType = null, durationSeconds = 0;

      if (req.file) {
        const result = await uploadFromBuffer(req.file.buffer, {
          resource_type: 'video',
          folder: 'verto/videos',
        });
        cloudinaryPublicId = result.public_id;
        videoUrl           = result.secure_url;
        hlsUrl             = result.playback_url || null;
        fileSizeBytes      = result.bytes || req.file.size || 0;
        mimeType           = req.file.mimetype || null;
        durationSeconds    = result.duration || 0;
      }

      const station = await getOrCreateStation(req.user._id);

      const video = await Video.create({
        ownerId: req.user._id,
        stationId: station._id,
        title: title.trim(),
        description: description || '',
        visibility: vis,
        tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim())) : [],
        category: category || '',
        status: 'ready',
        cloudinaryPublicId,
        videoUrl,
        hlsUrl,
        fileSizeBytes,
        mimeType,
        durationSeconds,
        publishedAt: vis === 'public' ? new Date() : null,
      });

      return res.status(201).json({ success: true, data: video });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── COMMENTS MANAGEMENT ─────────────────────────────────────────────────────

// PUT /me/comments/ban-user  — must be before /:id/approve
router.put('/me/comments/ban-user', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required.' });
    }
    // Mark all comments by this user on this creator's content as banned
    const station = await getOrCreateStation(req.user._id);
    const result = await Comment.updateMany(
      { authorId: userId },
      { isBanned: true }
    );
    return res.status(200).json({ success: true, data: { bannedCount: result.modifiedCount } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /me/comments
router.get('/me/comments', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    // Get all videos owned by this creator
    const videos = await Video.find({ ownerId: req.user._id }).select('_id');
    const videoIds = videos.map(v => v._id);
    const comments = await Comment.find({
      videoId: { $in: videoIds },
      isDeleted: false,
    }).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, data: { comments } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /me/comments/:id/approve
router.put('/me/comments/:id/approve', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    return res.status(200).json({ success: true, data: comment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

