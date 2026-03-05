/**
 * BILLING ROUTES
 * GET  /billing/transactions
 * GET  /billing/transactions/:id/invoice
 * POST /billing/payment-methods
 * GET  /billing/payment-methods
 * PUT  /billing/payment-methods/:id/primary
 * DELETE /billing/payment-methods/:id
 */

const router = require('express').Router();
const Transaction   = require('../models/Transaction');
const PaymentMethod = require('../models/PaymentMethod');
const { protect } = require('../middleware/auth');

// Mock Stripe card lookup (in production use Stripe SDK)
function parseStripePaymentMethod(pmId) {
  // Return mock card details based on pmId prefix
  const brandMap = { pm_card_visa: 'visa', pm_card_mastercard: 'mc', pm_card_amex: 'amex' };
  const brand = Object.keys(brandMap).find(k => pmId.startsWith(k))
    ? brandMap[Object.keys(brandMap).find(k => pmId.startsWith(k))]
    : 'visa';
  return { brand, last4: '4242', expiryMonth: 12, expiryYear: 2027 };
}

// ─── GET /billing/transactions ────────────────────────────────────────────────

router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, from, to } = req.query;
    const filter = { userId: req.user._id };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { transactions, total } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /billing/transactions/:id/invoice ────────────────────────────────────

router.get('/transactions/:id/invoice', protect, async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    const invoiceUrl = tx.invoiceUrl || `https://invoices.verto.tv/${tx._id}.pdf`;
    return res.status(200).json({ success: true, data: { invoiceUrl } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /billing/payment-methods ───────────────────────────────────────────

router.post('/payment-methods', protect, async (req, res) => {
  try {
    const { stripePaymentMethodId } = req.body;
    if (!stripePaymentMethodId) {
      return res.status(400).json({ success: false, message: 'stripePaymentMethodId is required.' });
    }
    const card = parseStripePaymentMethod(stripePaymentMethodId);
    const existingCount = await PaymentMethod.countDocuments({ userId: req.user._id });
    const pm = await PaymentMethod.create({
      userId:                req.user._id,
      brand:                 card.brand,
      last4:                 card.last4,
      expiryMonth:           card.expiryMonth,
      expiryYear:            card.expiryYear,
      isPrimary:             existingCount === 0,
      stripePaymentMethodId,
    });
    const data = pm.toObject();
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /billing/payment-methods ────────────────────────────────────────────

router.get('/payment-methods', protect, async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ userId: req.user._id }).select('-stripePaymentMethodId');
    return res.status(200).json({ success: true, data: methods });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /billing/payment-methods/:id/primary ────────────────────────────────

router.put('/payment-methods/:id/primary', protect, async (req, res) => {
  try {
    const pm = await PaymentMethod.findOne({ _id: req.params.id, userId: req.user._id });
    if (!pm) return res.status(404).json({ success: false, message: 'Payment method not found.' });
    // Clear existing primary
    await PaymentMethod.updateMany({ userId: req.user._id }, { isPrimary: false });
    pm.isPrimary = true;
    await pm.save();
    return res.status(200).json({ success: true, data: pm });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Payment method not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /billing/payment-methods/:id ─────────────────────────────────────

router.delete('/payment-methods/:id', protect, async (req, res) => {
  try {
    const pm = await PaymentMethod.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!pm) return res.status(404).json({ success: false, message: 'Payment method not found.' });
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Payment method not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
