/**
 * COMMENT ROUTES
 * POST   /comments/:id/reply
 * POST   /comments/:id/like
 * DELETE /comments/:id
 */

const router = require('express').Router();
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

// ─── POST /comments/:id/reply ─────────────────────────────────────────────────

router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || String(text).trim() === '') {
      return res.status(400).json({ success: false, message: 'text is required.' });
    }
    const parent = await Comment.findOne({ _id: req.params.id, isDeleted: false });
    if (!parent) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const reply = await Comment.create({
      authorId: req.user._id,
      videoId:  parent.videoId || null,
      postId:   parent.postId  || null,
      parentId: parent._id,
      text:     String(text).trim(),
    });

    return res.status(201).json({
      success: true,
      data: { ...reply.toObject(), parentId: String(parent._id) },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /comments/:id/like ──────────────────────────────────────────────────

router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, isDeleted: false });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    // Simple in-place toggle
    const likedBy = comment.get('likedBy') || [];
    const userId  = String(req.user._id);
    let liked;
    if (likedBy.includes(userId)) {
      comment.set('likedBy', likedBy.filter(id => id !== userId));
      comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
      liked = false;
    } else {
      likedBy.push(userId);
      comment.set('likedBy', likedBy);
      comment.likeCount = (comment.likeCount || 0) + 1;
      liked = true;
    }
    await comment.save();
    return res.status(200).json({ success: true, data: { liked, likeCount: comment.likeCount } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /comments/:id ─────────────────────────────────────────────────────

router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, isDeleted: false });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    if (String(comment.authorId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    comment.isDeleted = true;
    await comment.save();
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
