const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:          { type: String, enum: ['subscription', 'bundle', 'perk', 'refund'], default: 'subscription' },
    amount:        { type: Number, required: true },
    currency:      { type: String, default: 'USD' },
    status:        { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], default: 'succeeded' },
    description:   { type: String, default: '' },
    referenceId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceType: { type: String, default: null },
    invoiceUrl:    { type: String, default: null },
    metadata:      { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
