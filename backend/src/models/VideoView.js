const mongoose = require('mongoose');

const videoViewSchema = new mongoose.Schema(
  {
    videoId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ipHash:   { type: String },
    watchedAt:{ type: Date, default: Date.now },
  }
);
// indexes for fast lookups
videoViewSchema.index({ videoId: 1, viewerId: 1 });
videoViewSchema.index({ videoId: 1, ipHash: 1, watchedAt: -1 });

module.exports = mongoose.models.VideoView || mongoose.model('VideoView', videoViewSchema);
