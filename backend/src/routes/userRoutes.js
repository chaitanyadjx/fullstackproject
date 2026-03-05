/**
 * USER / ACCOUNT ROUTES
 * GET  /users/me                          — own profile
 * PUT  /users/me                          — update display name, bio, email
 * PUT  /users/me/avatar                   — upload / change profile photo
 * PUT  /users/me/password                 — change password
 * GET  /users/me/notifications/settings   — get notification preferences
 * PUT  /users/me/notifications/settings   — update notification preferences
 * GET  /users/:username                   — public profile (no sensitive fields)
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// ─── Helper ───────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const SAFE_FIELDS = '-passwordHash -passwordResetToken -passwordResetExpires';

// ─── GET /users/me ────────────────────────────────────────────────────────────

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(SAFE_FIELDS);
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /users/me ────────────────────────────────────────────────────────────

router.put('/me', protect, async (req, res) => {
  try {
    const { displayName, bio, email } = req.body;

    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio          !== undefined) updates.bio         = bio;
    if (email        !== undefined) updates.email       = email.toLowerCase();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select(SAFE_FIELDS);
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /users/me/avatar ─────────────────────────────────────────────────────

router.put('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar file provided.' });
    }

    // In production: stream req.file.buffer to a CDN.
    // Here we return a mock URL so the contract is satisfied.
    const avatarUrl = `https://cdn.verto.tv/avatars/${req.user._id}_${Date.now()}.jpg`;
    await User.findByIdAndUpdate(req.user._id, { avatarUrl });

    return res.status(200).json({ success: true, data: { avatarUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /users/me/password ───────────────────────────────────────────────────

router.put('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword, newPassword and confirmPassword are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.', data: {} });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /users/me/notifications/settings ────────────────────────────────────

router.get('/me/notifications/settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    return res.status(200).json({ success: true, data: user.notificationSettings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /users/me/notifications/settings ────────────────────────────────────

const NOTIF_FIELDS = [
  'newContentAlerts',
  'communityReplies',
  'exclusivePerks',
  'weeklyDigest',
  'billingReceipts',
  'productUpdates',
];

router.put('/me/notifications/settings', protect, async (req, res) => {
  try {
    const $set = {};

    for (const field of NOTIF_FIELDS) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'boolean') {
          return res.status(400).json({ success: false, message: `${field} must be a boolean.` });
        }
        $set[`notificationSettings.${field}`] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set },
      { new: true }
    ).select('notificationSettings');

    return res.status(200).json({ success: true, data: user.notificationSettings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
const Notification   = require('../models/Notification');
const PerkClaim      = require('../models/PerkClaim');
const Perk           = require('../models/Perk');
const Subscription   = require('../models/Subscription');

// PUT /me/notifications/read-all  — must be before /:id/read
router.put('/me/notifications/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.status(200).json({ success: true, data: { updatedCount: result.modifiedCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /me/notifications/:id/read
router.put('/me/notifications/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.status(200).json({ success: true, data: notif });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /me/notifications
router.get('/me/notifications', protect, async (req, res) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);
    return res.status(200).json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PERKS ────────────────────────────────────────────────────────────────────

// GET /me/perks
router.get('/me/perks', protect, async (req, res) => {
  try {
    const claims = await PerkClaim.find({ userId: req.user._id }).populate({
      path: 'perkId',
      select: 'title type downloadUrl code',
    });
    const data = claims.map(c => ({
      _id:         c._id,
      perkId:      c.perkId?._id,
      title:       c.perkId?.title,
      type:        c.perkId?.type,
      downloadUrl: c.perkId?.downloadUrl || undefined,
      claimedAt:   c.claimedAt,
    }));
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────

// GET /me/subscriptions
router.get('/me/subscriptions', protect, async (req, res) => {
  try {
    const subs = await Subscription.find({ subscriberId: req.user._id })
      .populate('tierId', 'name price currency')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: subs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /users/:username — public profile ────────────────────────────────────

router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).select(
      '-passwordHash -email -passwordResetToken -passwordResetExpires -notificationSettings'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
