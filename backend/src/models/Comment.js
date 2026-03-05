const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Video', default: null },
    postId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Post',  default: null },
    parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    text:       { type: String, required: true, trim: true },
    likeCount:  { type: Number, default: 0 },
    isApproved: { type: Boolean, default: true },
    isBanned:   { type: Boolean, default: false },
    isDeleted:  { type: Boolean, default: false },
    likedBy:    [{ type: String }],              // user ID strings for toggle-like
  },
  { timestamps: true }
);

commentSchema.index({ videoId: 1, createdAt: -1 });
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1 });

module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
