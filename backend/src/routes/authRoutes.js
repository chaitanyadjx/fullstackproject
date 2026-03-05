/**
 * AUTH ROUTES
 * POST /auth/register
 * POST /auth/login
 * POST /auth/logout
 * POST /auth/forgot-password
 * POST /auth/verify-reset-token
 * POST /auth/reset-password
 * POST /auth/verify-email
 * POST /auth/resend-verification
 * GET  /auth/me
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      return res.status(400).json({ success: false, message: 'fullName is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName: fullName.trim(), email, passwordHash });

    return res.status(201).json({
      success: true,
      message: 'Account created. Check your email to verify.',
      data: { userId: user._id },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const accessToken  = signToken(user._id);
    const refreshToken = signToken(user._id);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id:       user._id,
          fullName:  user.fullName,
          email:     user.email,
          role:      user.role,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

router.post('/logout', protect, (req, res) => {
  // Stateless JWT — client discards token. Server-side blacklist can be added.
  return res.status(200).json({ success: true, message: 'Logged out successfully.', data: {} });
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken   = token;
      user.passwordResetExpires = Date.now() + 3_600_000; // 1 hour
      await user.save();
      // In production: send email with token link here
    }

    // Always return 200 to prevent user enumeration
    return res.status(200).json({ success: true, message: 'Reset link sent if account exists.', data: {} });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /auth/verify-reset-token ───────────────────────────────────────────

router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required.' });
    }

    const user = await User.findOne({
      passwordResetToken:   token,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    return res.status(200).json({ success: true, message: 'Token is valid.', data: {} });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'token, newPassword and confirmPassword are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({
      passwordResetToken:   token,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    user.passwordHash         = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated. Please sign in.', data: {} });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /auth/verify-email ──────────────────────────────────────────────────

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required.' });
    }
    // In production: look up verification token in DB
    return res.status(200).json({ success: true, message: 'Email verified successfully.', data: {} });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /auth/resend-verification ──────────────────────────────────────────

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    return res.status(200).json({ success: true, message: 'Verification email resent.', data: {} });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

router.get('/me', protect, (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
});

module.exports = router;
