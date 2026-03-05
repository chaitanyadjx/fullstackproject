/**
 * COMMUNITY ROUTES
 * GET /community/feed  — aggregated post feed for authenticated user
 */

const router = require('express').Router();
const Post         = require('../models/Post');
const Subscription = require('../models/Subscription');
const Tier         = require('../models/Tier');
const Station      = require('../models/Station');
const { protect } = require('../middleware/auth');

// ─── GET /community/feed ──────────────────────────────────────────────────────

router.get('/feed', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get station IDs from active subscriptions
    const subs = await Subscription.find({
      subscriberId: req.user._id,
      status: 'active',
    }).populate({ path: 'tierId', select: 'ownerId' });

    const ownerIds = subs
      .map(s => s.tierId?.ownerId)
      .filter(Boolean);

    const stations = await Station.find({ ownerId: { $in: ownerIds } }).select('_id');
    const stationIds = stations.map(s => s._id);

    const posts = await Post.find({
      isDeleted: false,
      ...(stationIds.length > 0 ? { stationId: { $in: stationIds } } : {}),
    }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    // Ensure author field present
    const enriched = posts.map(p => {
      const obj = p.toObject();
      if (!obj.author) obj.author = { _id: obj.authorId };
      return obj;
    });

    return res.status(200).json({ success: true, data: { posts: enriched } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
