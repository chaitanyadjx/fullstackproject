/**
 * SUBSCRIPTION ROUTES
 * POST /subscriptions          — subscribe to a tier (mock payment)
 * GET  /subscriptions/:id      — get subscription details
 * PUT  /subscriptions/:id/cancel
 * PUT  /subscriptions/:id/reactivate
 * POST /subscriptions/bundle   — subscribe to a bundle
 */

const router = require('express').Router();
const Tier         = require('../models/Tier');
const Bundle       = require('../models/Bundle');
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');

// ─── POST /subscriptions/bundle  — must be BEFORE /:id ───────────────────────

router.post('/bundle', protect, async (req, res) => {
  try {
    const { bundleId, paymentMethodId } = req.body;
    if (!bundleId) {
      return res.status(400).json({ success: false, message: 'bundleId is required.' });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'paymentMethodId is required.' });
    }
    const bundle = await Bundle.findById(bundleId);
    if (!bundle || !bundle.isActive) {
      return res.status(404).json({ success: false, message: 'Bundle not found or inactive.' });
    }
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);
    const sub = await Subscription.create({
      subscriberId:    req.user._id,
      bundleId:        bundle._id,
      status:          'active',
      paymentMethodId,
      renewsAt,
      amount:          bundle.price,
      currency:        'USD',
      billingPeriod:   bundle.billingPeriod,
    });
    return res.status(201).json({ success: true, data: { ...sub.toObject(), bundleId: bundle._id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /subscriptions ─────────────────────────────────────────────────────

router.post('/', protect, async (req, res) => {
  try {
    const { tierId, paymentMethodId } = req.body;
    if (!tierId) {
      return res.status(400).json({ success: false, message: 'tierId is required.' });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'paymentMethodId is required.' });
    }
    const tier = await Tier.findById(tierId);
    if (!tier) return res.status(404).json({ success: false, message: 'Tier not found.' });

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const sub = await Subscription.create({
      subscriberId:    req.user._id,
      tierId:          tier._id,
      stationId:       null,
      status:          'active',
      paymentMethodId,
      renewsAt,
      amount:          tier.price,
      currency:        tier.currency || 'USD',
      billingPeriod:   tier.billingPeriod,
    });
    return res.status(201).json({ success: true, data: sub });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /subscriptions/:id ───────────────────────────────────────────────────

router.get('/:id', protect, async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      _id: req.params.id,
      subscriberId: req.user._id,
    }).populate('tierId');
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    const data = sub.toObject();
    data.tier        = data.tierId;
    data.renewalDate = data.renewsAt;
    delete data.tierId;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /subscriptions/:id/cancel ───────────────────────────────────────────

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, subscriberId: req.user._id });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    const expiresAt = sub.renewsAt || new Date();
    sub.status     = 'canceled';
    sub.canceledAt = new Date();
    await sub.save();

    return res.status(200).json({
      success: true,
      data: { ...sub.toObject(), status: 'cancelled', expiresAt },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /subscriptions/:id/reactivate ───────────────────────────────────────

router.put('/:id/reactivate', protect, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'paymentMethodId is required.' });
    }
    const sub = await Subscription.findOne({ _id: req.params.id, subscriberId: req.user._id });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);
    sub.status          = 'active';
    sub.canceledAt      = null;
    sub.renewsAt        = renewsAt;
    sub.paymentMethodId = paymentMethodId;
    await sub.save();

    return res.status(200).json({ success: true, data: sub });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
