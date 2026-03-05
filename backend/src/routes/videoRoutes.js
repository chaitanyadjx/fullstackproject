/**
 * VIDEO ROUTES  (MongoDB + Cloudinary storage)
 */

const router  = require('express').Router();
const multer  = require('multer');
const crypto  = require('crypto');
const { cloudinary, uploadFromBuffer, destroy } = require('../config/cloudinary');
const { protect, requireRole } = require('../middleware/auth');
const Video = require('../models/Video');
const VideoView = require('../models/VideoView');
const VideoLike = require('../models/VideoLike');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 4 * 1024 * 1024 * 1024 }, // 4 GB
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hlsUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type:      'video',
    streaming_profile:  'auto',
    format:             'm3u8',
  });
}

// ─── POST /videos/upload ──────────────────────────────────────────────────────
router.post(
  '/upload',
  protect,
  requireRole('creator', 'admin'),
  upload.single('videoFile'),
  async (req, res) => {
    try {
      const { title, description = '', category = '', visibility = 'public' } = req.body;
      if (!title || title.trim() === '') {
        return res.status(400).json({ success: false, message: 'title is required.' });
      }
      const validVisibilities = ['public', 'private', 'unlisted', 'members_only'];
      if (!validVisibilities.includes(visibility)) {
        return res.status(400).json({ success: false, message: `visibility must be one of: ${validVisibilities.join(', ')}.` });
      }

      let tags = [];
      if (req.body.tags) {
        try {
          tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
        } catch {
          tags = req.body.tags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }

      let cloudinaryPublicId, videoUrl, videoHlsUrl, thumbnailUrl, fileSizeBytes, mimeType, durationSeconds;

      if (req.file) {
        const result = await uploadFromBuffer(req.file.buffer, {
          resource_type: 'video',
          folder:        `verto/videos/${req.user._id}`,
          eager: [{ format: 'jpg', transformation: [{ start_offset: '0' }] }],
          eager_async: false,
        });
        cloudinaryPublicId = result.public_id;
        videoUrl           = result.secure_url;
        videoHlsUrl        = hlsUrl(result.public_id);
        thumbnailUrl       = result.eager?.[0]?.secure_url
          ?? cloudinary.url(result.public_id, { resource_type: 'video', format: 'jpg' });
        fileSizeBytes      = req.file.size;
        mimeType           = req.file.mimetype;
        durationSeconds    = result.duration ?? 0;
      }

      const video = await Video.create({
        ownerId: req.user._id,
        stationId: req.user._id,
        title: title.trim(),
        description,
        tags,
        category,
        visibility,
        cloudinaryPublicId,
        videoUrl,
        hlsUrl: videoHlsUrl,
        fileSizeBytes:   fileSizeBytes   ?? 0,
        mimeType:        mimeType        ?? null,
        durationSeconds: durationSeconds ?? 0,
        thumbnailUrl,
      });

      return res.status(201).json({
        success: true,
        message: 'Video uploaded successfully.',
        data: video,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── POST /videos/:id/thumbnail ───────────────────────────────────────────────
router.post(
  '/:id/thumbnail',
  protect,
  requireRole('creator', 'admin'),
  upload.single('thumbnailFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'thumbnailFile is required.' });
      }

      const video = await Video.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
      if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found.' });
      }
      if (String(video.ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }

      if (video.thumbnailPublicId) {
        await destroy(video.thumbnailPublicId, 'image');
      }

      const result = await uploadFromBuffer(req.file.buffer, {
        resource_type: 'image',
        folder:        `verto/thumbnails/${req.user._id}`,
        overwrite:     true,
      });

      video.thumbnailUrl = result.secure_url;
      video.thumbnailPublicId = result.public_id;
      await video.save();

      return res.status(200).json({ success: true, data: { thumbnailUrl: result.secure_url } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── GET /videos/:id/stream ───────────────────────────────────────────────────
router.get('/:id/stream', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video || video.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    if (video.visibility === 'private') {
      if (String(video.ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        mp4Url: video.videoUrl,
        hlsUrl: video.hlsUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /videos/mine ─────────────────────────────────────────────────────────
router.get('/mine', protect, requireRole('creator', 'admin'), async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '20', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);

    const match = { ownerId: req.user._id, status: { $ne: 'deleted' } };

    // filter=drafts → only draft / processing
    if (req.query.filter === 'drafts') {
      match.status = { $in: ['draft', 'processing'] };
    }

    const videos = await Video.find(match)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Video.countDocuments(match);

    return res.status(200).json({
      success: true, data: videos,
      total, limit, offset,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /videos (public listing) ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit    = Math.min(parseInt(req.query.limit    || '20', 10), 100);
    const offset   = parseInt(req.query.offset || '0', 10);
    const category = req.query.category || null;
    const search   = req.query.q        || null;

    const match = { status: 'ready', visibility: 'public' };

    if (category) { match.category = category; }
    if (search) {
      match.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const videos = await Video.find(match)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({ success: true, data: videos, limit, offset });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /videos/:id ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }
    if (video.visibility === 'private') {
      return res.status(403).json({ success: false, message: 'This video is private.' });
    }

    return res.status(200).json({ success: true, data: video });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /videos/:id ──────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });
    
    if (String(video.ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const allowed = ['title', 'description', 'category', 'visibility'];
    let updatedFields = {};

    allowed.forEach((f) => {
      if (req.body[f] !== undefined) {
        updatedFields[f] = req.body[f];
      }
    });

    if (req.body.tags !== undefined) {
      let tags = req.body.tags;
      if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map((t) => t.trim()); }
      }
      updatedFields.tags = tags;
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided.' });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    return res.status(200).json({ success: true, data: updatedVideo });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /videos/:id ───────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });
    
    if (String(video.ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    video.status = 'deleted';
    await video.save();

    const deletions = [];
    if (video.cloudinaryPublicId) deletions.push(destroy(video.cloudinaryPublicId, 'video'));
    if (video.thumbnailPublicId) deletions.push(destroy(video.thumbnailPublicId, 'image'));
    await Promise.all(deletions);

    return res.status(200).json({ success: true, message: 'Video deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /videos/:id/view ────────────────────────────────────────────────────
router.post('/:id/view', async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, status: 'ready' });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });

    const viewerId = req.user?._id ? req.user._id : null;
    const ipHash   = crypto.createHash('sha256').update(req.ip || '').digest('hex');

    let dedup;
    if (viewerId) {
      dedup = await VideoView.findOne({ videoId: req.params.id, viewerId });
    } else {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      dedup = await VideoView.findOne({ videoId: req.params.id, ipHash, watchedAt: { $gt: oneHourAgo } });
    }

    if (!dedup) {
      await VideoView.create({ videoId: req.params.id, viewerId, ipHash });
      video.viewCount += 1;
      await video.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /videos/:id/like ────────────────────────────────────────────────────
router.post('/:id/like', protect, async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, status: 'ready' });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });

    const userId = req.user._id;
    const existing = await VideoLike.findOne({ videoId: req.params.id, userId });

    if (existing) {
      await VideoLike.deleteOne({ _id: existing._id });
      video.likeCount = Math.max(0, video.likeCount - 1);
      await video.save();
      return res.status(200).json({ success: true, data: { liked: false, likeCount: video.likeCount } });
    } else {
      await VideoLike.create({ videoId: req.params.id, userId });
      video.likeCount += 1;
      await video.save();
      return res.status(200).json({ success: true, data: { liked: true, likeCount: video.likeCount } });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /videos/:id/comments ─────────────────────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const limit  = Math.min(parseInt(req.query.limit  || '20', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const comments = await Comment.find({ videoId: req.params.id, parentId: null })
      .sort({ createdAt: -1 }).skip(offset).limit(limit);
    return res.status(200).json({ success: true, data: { comments } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /videos/:id/comments ────────────────────────────────────────────────
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'text is required.' });
    }
    const video = await Video.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });
    const comment = await Comment.create({ authorId: req.user._id, videoId: req.params.id, text: text.trim() });
    video.commentCount += 1;
    await video.save();
    return res.status(201).json({ success: true, data: comment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
