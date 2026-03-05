/**
 * ADMIN ROUTES
 * All routes require admin role.
 */

const router = require('express').Router();
const User               = require('../models/User');
const CreatorApplication = require('../models/CreatorApplication');
const Report             = require('../models/Report');
const Bundle             = require('../models/Bundle');
const Video              = require('../models/Video');
const Subscription       = require('../models/Subscription');
const Station            = require('../models/Station');
const { protect, requireRole } = require('../middleware/auth');

const isAdmin = [protect, requireRole('admin')];

// ─── GET /admin/stats ─────────────────────────────────────────────────────────

router.get('/stats', ...isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalCreators, activeSubscriptions, pendingApplications, openReports] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'creator' }),
        Subscription.countDocuments({ status: 'active' }),
        CreatorApplication.countDocuments({ status: 'pending' }),
        Report.countDocuments({ status: 'open' }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCreators,
        totalRevenue: 0,        // real value from payment processor in production
        activeSubscriptions,
        pendingApplications,
        openReports,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /admin/creators/applications ────────────────────────────────────────

router.get('/creators/applications', ...isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [applications, total] = await Promise.all([
      CreatorApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      CreatorApplication.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { applications, total } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /admin/creators/applications/:id/approve ────────────────────────────

router.put('/creators/applications/:id/approve', ...isAdmin, async (req, res) => {
  try {
    const app = await CreatorApplication.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    // Promote user to creator role
    await User.findByIdAndUpdate(app.userId, { role: 'creator' });
    return res.status(200).json({ success: true, data: app });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /admin/creators/applications/:id/reject ─────────────────────────────

router.put('/creators/applications/:id/reject', ...isAdmin, async (req, res) => {
  try {
    const app = await CreatorApplication.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', reviewNote: req.body.reason || '' },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    return res.status(200).json({ success: true, data: app });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /admin/reports ───────────────────────────────────────────────────────

router.get('/reports', ...isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Report.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { reports, total } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /admin/reports/:id ───────────────────────────────────────────────────

router.put('/reports/:id', ...isAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(note && { note }), resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /admin/reports/:id/ban-user ─────────────────────────────────────────

router.put('/reports/:id/ban-user', ...isAdmin, async (req, res) => {
  try {
    const { reason, durationDays } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'reason is required.' });
    }
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    await User.findByIdAndUpdate(report.targetId, { isBanned: true });
    report.status = 'actioned';
    report.note = `User banned. Reason: ${reason}. Duration: ${durationDays || 'permanent'} days.`;
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /admin/reports/:id/warn-user ────────────────────────────────────────

router.put('/reports/:id/warn-user', ...isAdmin, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'actioned', note: 'User warned.', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /admin/content/:id/takedown ─────────────────────────────────────────

router.put('/content/:id/takedown', ...isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'reason is required.' });
    }
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted', visibility: 'private' },
      { new: true }
    );
    if (!video) return res.status(404).json({ success: false, message: 'Content not found.' });
    return res.status(200).json({ success: true, data: { taken_down: true, reason } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN BUNDLES ────────────────────────────────────────────────────────────

// POST /admin/bundles
router.post('/bundles', ...isAdmin, async (req, res) => {
  try {
    const { name, description, price, billingPeriod, stationIds } = req.body;
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'name is required.' });
    }
    if (!price) {
      return res.status(400).json({ success: false, message: 'price is required.' });
    }
    const bundle = await Bundle.create({
      name: name.trim(),
      description: description || '',
      price: Number(price),
      billingPeriod: billingPeriod || 'monthly',
      stationIds: stationIds || [],
      createdBy: req.user._id,
    });
    return res.status(201).json({ success: true, data: bundle });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/bundles  — includes inactive
router.get('/bundles', ...isAdmin, async (req, res) => {
  try {
    const bundles = await Bundle.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: bundles });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /admin/bundles/:id
router.put('/bundles/:id', ...isAdmin, async (req, res) => {
  try {
    const { name, description, price, billingPeriod, stationIds, isActive } = req.body;
    const updates = {};
    if (name          !== undefined) updates.name          = name;
    if (description   !== undefined) updates.description   = description;
    if (price         !== undefined) updates.price         = Number(price);
    if (billingPeriod !== undefined) updates.billingPeriod = billingPeriod;
    if (stationIds    !== undefined) updates.stationIds    = stationIds;
    if (isActive      !== undefined) updates.isActive      = isActive;

    const bundle = await Bundle.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle not found.' });
    return res.status(200).json({ success: true, data: bundle });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /admin/bundles/:id
router.delete('/bundles/:id', ...isAdmin, async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle not found.' });
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
