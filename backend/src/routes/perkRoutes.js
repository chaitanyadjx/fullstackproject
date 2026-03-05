/**
 * PERK ROUTES
 * POST /perks/:id/claim  — claim a perk
 */

const router   = require('express').Router();
const Perk     = require('../models/Perk');
const PerkClaim = require('../models/PerkClaim');
const { protect } = require('../middleware/auth');

// ─── POST /perks/:id/claim ────────────────────────────────────────────────────

router.post('/:id/claim', protect, async (req, res) => {
  try {
    const perk = await Perk.findOne({ _id: req.params.id, isActive: true });
    if (!perk) return res.status(404).json({ success: false, message: 'Perk not found.' });

    // Check if already claimed
    const existing = await PerkClaim.findOne({ perkId: perk._id, userId: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already claimed this perk.' });
    }

    const claim = await PerkClaim.create({ perkId: perk._id, userId: req.user._id });
    await Perk.findByIdAndUpdate(perk._id, { $inc: { claimCount: 1 } });

    const data = {
      _id:         claim._id,
      perkId:      perk._id,
      title:       perk.title,
      type:        perk.type,
      claimedAt:   claim.claimedAt,
    };
    if (perk.type === 'download') data.downloadUrl = perk.downloadUrl;
    if (perk.type === 'code')     data.code        = perk.code;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Perk not found.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
