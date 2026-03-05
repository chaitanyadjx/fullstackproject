/**
 * DISCOVERY / BROWSE ROUTES  (mounted at /api/v1/stations AND /api/v1/discover)
 *
 * GET /stations                   — list public stations
 * GET /stations/:id               — station detail page
 * GET /stations/:id/tiers         — public tiers for a station
 * GET /stations/:id/videos        — public videos for a station
 * GET /stations/:id/posts         — posts for a station
 * POST /stations/:id/posts        — create post on station (creator only)
 * GET /discover/categories        — browse categories
 * GET /discover/featured          — featured content
 */

const router = require('express').Router();
const Station = require('../models/Station');
const Video   = require('../models/Video');
const Tier    = require('../models/Tier');
const Post    = require('../models/Post');
const { protect, requireRole } = require('../middleware/auth');

// ─── GET /categories ──────────────────────────────────────────────────────────
// (when mounted at /discover, accessed as /discover/categories)

router.get('/categories', async (req, res) => {
  try {
    const agg = await Station.aggregate([
      { $group: { _id: '$category', stationCount: { $sum: 1 } } },
      { $project: { name: '$_id', stationCount: 1, _id: 0 } },
      { $match: { name: { $ne: null, $ne: '' } } },
      { $sort: { stationCount: -1 } },
    ]);
    return res.status(200).json({ success: true, data: agg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /featured ────────────────────────────────────────────────────────────
// (when mounted at /discover, accessed as /discover/featured)

router.get('/featured', async (req, res) => {
  try {
    const [featuredStations, trendingVideos] = await Promise.all([
      Station.find().select('-streamKey').sort({ subscriberCount: -1 }).limit(6),
      Video.find({ status: 'ready', visibility: 'public' }).sort({ viewCount: -1 }).limit(12),
    ]);
    return res.status(200).json({ success: true, data: { featuredStations, trendingVideos } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /stations ────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search)   filter.name     = { $regex: search, $options: 'i' };
    if (category) filter.category = category;

    const sortMap = {
      popular: { subscriberCount: -1 },
      newest:  { createdAt: -1 },
      default: { subscriberCount: -1 },
    };
    const sortOrder = sortMap[sort] || sortMap.default;
    const skip = (Number(page) - 1) * Number(limit);

    const [stations, total] = await Promise.all([
      Station.find(filter).select('-streamKey').sort(sortOrder).skip(skip).limit(Number(limit)),
      Station.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { stations, total } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /stations/:id/tiers ──────────────────────────────────────────────────

router.get('/:id/tiers', async (req, res) => {
  try {
    const station = await Station.findById(req.params.id).select('-streamKey');
    if (!station) return res.status(404).json({ success: false, message: 'Station not found.' });
    const tiers = await Tier.find({ ownerId: station.ownerId, isActive: true })
      .select('-__v')
      .sort({ price: 1 });
    return res.status(200).json({ success: true, data: tiers });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /stations/:id/videos ─────────────────────────────────────────────────

router.get('/:id/videos', async (req, res) => {
  try {
    const station = await Station.findById(req.params.id).select('-streamKey');
    if (!station) return res.status(404).json({ success: false, message: 'Station not found.' });
    const filter = {
      stationId:  station._id,
      status:     'ready',
      visibility: 'public',
    };
    const videos = await Video.find(filter).sort({ publishedAt: -1 }).limit(50);
    return res.status(200).json({ success: true, data: { videos } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /stations/:id/posts ─────────────────────────────────────────────────

router.post('/:id/posts', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const { content, type, imageUrl } = req.body;
    if (!content || String(content).trim() === '') {
      return res.status(400).json({ success: false, message: 'content is required.' });
    }

    // Verify requester owns the station
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found.' });

    if (String(station.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only post on your own station.' });
    }

    const validTypes = ['announcement', 'update', 'poll', 'media', 'text'];
    const postType = (type && validTypes.includes(type)) ? type : 'text';

    const post = await Post.create({
      authorId:  req.user._id,
      stationId: station._id,
      content:   content.trim(),
      type:      postType,
      imageUrl:  imageUrl || null,
      author:    { _id: req.user._id, fullName: req.user.fullName, avatarUrl: req.user.avatarUrl },
    });
    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /stations/:id/posts ──────────────────────────────────────────────────

router.get('/:id/posts', async (req, res) => {
  try {
    const station = await Station.findById(req.params.id).select('-streamKey');
    if (!station) return res.status(404).json({ success: false, message: 'Station not found.' });
    const posts = await Post.find({ stationId: station._id, isDeleted: false })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, data: { posts } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /stations/:id ────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const station = await Station.findById(req.params.id).select('-streamKey');
    if (!station) return res.status(404).json({ success: false, message: 'Station not found.' });

    const [tiers, recentVideos] = await Promise.all([
      Tier.find({ ownerId: station.ownerId, isActive: true }).select('-__v').sort({ price: 1 }),
      Video.find({ stationId: station._id, status: 'ready', visibility: 'public' })
        .sort({ publishedAt: -1 }).limit(6),
    ]);

    return res.status(200).json({
      success: true,
      data: { ...station.toObject(), tiers, recentVideos },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
