const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    description:     { type: String, default: '' },
    price:           { type: Number, required: true, min: 0.01 },
    billingPeriod:   { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
    stationIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
    coverImageUrl:   { type: String, default: null },
    isActive:        { type: Boolean, default: true },
    subscriberCount: { type: Number, default: 0 },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bundleSchema.index({ isActive: 1 });

module.exports = mongoose.models.Bundle || mongoose.model('Bundle', bundleSchema);
