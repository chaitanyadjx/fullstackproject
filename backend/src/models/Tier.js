const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema(
  {
    ownerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:          { type: String, required: true, trim: true },
    description:   { type: String, default: '' },
    price:         { type: Number, required: true, min: 0.01 },
    currency:      { type: String, default: 'USD', uppercase: true },
    billingPeriod: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
    perks:         [{ type: String }],
    color:         { type: String, default: '#6C63FF' },
    isActive:      { type: Boolean, default: true },
    subscriberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tierSchema.index({ ownerId: 1 });

module.exports = mongoose.models.Tier || mongoose.model('Tier', tierSchema);
