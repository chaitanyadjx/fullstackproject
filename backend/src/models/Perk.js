const mongoose = require('mongoose');

const perkSchema = new mongoose.Schema(
  {
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    type:         { type: String, enum: ['download', 'code', 'link', 'text'], required: true },
    downloadUrl:  { type: String, default: null },
    code:         { type: String, default: null },
    tierRequired: { type: mongoose.Schema.Types.ObjectId, ref: 'Tier', default: null },
    claimCount:   { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

perkSchema.index({ ownerId: 1 });

module.exports = mongoose.models.Perk || mongoose.model('Perk', perkSchema);
