const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId:                { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    brand:                 { type: String, default: 'visa' },    // visa, mastercard, amex ...
    last4:                 { type: String, required: true },
    expiryMonth:           { type: Number, required: true },
    expiryYear:            { type: Number, required: true },
    isPrimary:             { type: Boolean, default: false },
    stripePaymentMethodId: { type: String, required: true },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ userId: 1 });

module.exports = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', paymentMethodSchema);
