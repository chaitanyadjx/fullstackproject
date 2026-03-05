const mongoose = require('mongoose');

const perkClaimSchema = new mongoose.Schema(
  {
    perkId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Perk', required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    claimedAt: { type: Date, default: Date.now },
  }
);

perkClaimSchema.index({ perkId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.PerkClaim || mongoose.model('PerkClaim', perkClaimSchema);
