/**
 * BUNDLE ROUTES (public + admin)
 * GET  /bundles         — public active bundles
 * GET  /bundles/:id     — single bundle
 * POST /bundles         — admin creates bundle
 * PUT  /bundles/:id     — admin updates bundle
 * DELETE /bundles/:id   — admin deletes bundle
 */

const router = require('express').Router();
const Bundle  = require('../models/Bundle');
const Station = require('../models/Station');
const { protect, requireRole } = require('../middleware/auth');

// ─── GET /bundles ─────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const bundles = await Bundle.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: bundles });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /bundles (admin) ────────────────────────────────────────────────────

router.post('/', protect, requireRole('admin'), async (req, res) => {
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

// ─── GET /bundles/:id ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle not found.' });

    // Populate station summaries
    const stations = await Station.find({ _id: { $in: bundle.stationIds } }).select('-streamKey');
    return res.status(200).json({ success: true, data: { ...bundle.toObject(), stations } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Bundle not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /bundles/:id (admin) ─────────────────────────────────────────────────

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
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
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Bundle not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /bundles/:id (admin) ──────────────────────────────────────────────

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle not found.' });
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Bundle not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
