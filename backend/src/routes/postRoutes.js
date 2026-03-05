/**
 * POST ROUTES
 * GET   /posts/:id
 * PUT   /posts/:id
 * DELETE /posts/:id
 * POST  /posts/:id/like
 * GET   /posts/:id/comments
 * POST  /posts/:id/comments
 */

const router = require('express').Router();
const Post    = require('../models/Post');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

// ─── GET /posts/:id ───────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const obj = post.toObject();
    if (!obj.author) obj.author = { _id: obj.authorId };
    return res.status(200).json({ success: true, data: obj });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /posts/:id ───────────────────────────────────────────────────────────

router.put('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (String(post.authorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const { content, type, imageUrl } = req.body;
    if (content !== undefined) post.content  = content;
    if (type    !== undefined) post.type     = type;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;
    await post.save();
    return res.status(200).json({ success: true, data: post });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /posts/:id ────────────────────────────────────────────────────────

router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (String(post.authorId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    post.isDeleted = true;
    await post.save();
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /posts/:id/like ─────────────────────────────────────────────────────

router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    // Simple toggle stored in a set — use a dedicated PostLike model in production
    // For now use a likedBy array on the post (added on-the-fly if not present)
    const likedBy = post.get('likedBy') || [];
    const userId  = String(req.user._id);
    let liked;
    if (likedBy.includes(userId)) {
      post.set('likedBy', likedBy.filter(id => id !== userId));
      post.likeCount = Math.max(0, (post.likeCount || 0) - 1);
      liked = false;
    } else {
      likedBy.push(userId);
      post.set('likedBy', likedBy);
      post.likeCount = (post.likeCount || 0) + 1;
      liked = true;
    }
    await post.save();
    return res.status(200).json({ success: true, data: { liked, likeCount: post.likeCount } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /posts/:id/comments ──────────────────────────────────────────────────

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id, isDeleted: false })
      .sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: { comments } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /posts/:id/comments ─────────────────────────────────────────────────

router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || String(text).trim() === '') {
      return res.status(400).json({ success: false, message: 'text is required.' });
    }
    const comment = await Comment.create({
      authorId: req.user._id,
      postId:   req.params.id,
      text:     String(text).trim(),
    });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });
    return res.status(201).json({ success: true, data: comment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
