/**
 * LIVE STREAM ROUTES
 * GET  /streams/live          — currently live streams
 * GET  /streams/:id           — single stream details
 * POST /streams/:id/chat      — send chat message
 * GET  /streams/:id/chat      — get chat history
 */

const router = require('express').Router();
const Stream = require('../models/Stream');
const { protect } = require('../middleware/auth');

// In-memory chat store (in production use Redis or a proper chat model)
const chatStore = new Map();

// ─── GET /streams/live ────────────────────────────────────────────────────────

router.get('/live', async (req, res) => {
  try {
    const streams = await Stream.find({ status: 'live' }).sort({ viewerCount: -1 }).limit(50);
    const data = streams.map(s => ({
      _id:           s._id,
      title:         s.title,
      description:   s.description,
      category:      s.category,
      thumbnailUrl:  s.thumbnailUrl,
      viewerCount:   s.viewerCount,
      stationId:     s.stationId,
      ownerId:       s.ownerId,
      startedAt:     s.startedAt,
      currentlyLive: true,
    }));
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /streams/:id ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });
    const data = stream.toObject();
    delete data.streamKey;
    data.currentlyLive = stream.status === 'live';
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Stream not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /streams/:id/chat ───────────────────────────────────────────────────

router.post('/:id/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'message cannot be empty.' });
    }
    const chatMsg = {
      _id:       String(Date.now()),
      userId:    req.user._id,
      message:   String(message).trim(),
      timestamp: new Date(),
    };
    if (!chatStore.has(req.params.id)) chatStore.set(req.params.id, []);
    chatStore.get(req.params.id).push(chatMsg);
    return res.status(201).json({ success: true, data: chatMsg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /streams/:id/chat ────────────────────────────────────────────────────

router.get('/:id/chat', async (req, res) => {
  try {
    // Optionally validate stream exists
    const stream = await Stream.findById(req.params.id).catch(() => null);
    if (!stream) {
      const messages = chatStore.get(req.params.id) || [];
      if (messages.length === 0) {
        return res.status(404).json({ success: false, message: 'Stream not found.' });
      }
    }
    const messages = chatStore.get(req.params.id) || [];
    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
