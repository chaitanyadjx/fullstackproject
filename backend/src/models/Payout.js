const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    creatorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount:      { type: Number, required: true, min: 0.01 },
    currency:    { type: String, default: 'USD' },
    status:      { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    accountInfo: { type: String, default: '' },
    note:        { type: String, default: '' },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

payoutSchema.index({ creatorId: 1, createdAt: -1 });

module.exports = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
