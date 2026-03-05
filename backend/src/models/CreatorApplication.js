const mongoose = require('mongoose');

const creatorApplicationSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationName:  { type: String, required: true, trim: true },
    category:     { type: String, required: true, trim: true },
    portfolioUrl: { type: String, default: '' },
    description:  { type: String, default: '' },
    status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote:   { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CreatorApplication ||
  mongoose.model('CreatorApplication', creatorApplicationSchema);
