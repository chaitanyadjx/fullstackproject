const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    authorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    content:      { type: String, required: true, trim: true },
    type:         { type: String, enum: ['announcement', 'update', 'poll', 'media', 'text'], default: 'text' },
    imageUrl:     { type: String, default: null },
    likeCount:    { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPinned:     { type: Boolean, default: false },
    isDeleted:    { type: Boolean, default: false },
    author:       { type: Object, default: null }, // denormalised for quick reads
    likedBy:      [{ type: String }],              // user ID strings for toggle-like
  },
  { timestamps: true }
);

postSchema.index({ stationId: 1, createdAt: -1 });
postSchema.index({ authorId: 1 });

module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);
