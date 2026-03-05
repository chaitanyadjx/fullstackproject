const mongoose = require('mongoose');

const videoLikeSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likedAt: { type: Date, default: Date.now }
  }
);

videoLikeSchema.index({ videoId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.VideoLike || mongoose.model('VideoLike', videoLikeSchema);
