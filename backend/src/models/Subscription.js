const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    subscriberId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tierId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Tier', default: null },
    bundleId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle', default: null },
    stationId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },
    status:          { type: String, enum: ['active', 'canceled', 'past_due', 'pending'], default: 'active' },
    paymentMethodId: { type: String, default: null },
    billingPeriod:   { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
    renewsAt:        { type: Date },
    canceledAt:      { type: Date },
    amount:          { type: Number, default: 0 },
    currency:        { type: String, default: 'USD' },
  },
  { timestamps: true }
);

subscriptionSchema.index({ subscriberId: 1 });
subscriptionSchema.index({ tierId: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
