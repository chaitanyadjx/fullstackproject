const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    ownerId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    title:               { type: String, required: true },
    description:         { type: String, default: '' },
    tags:                [{ type: String }],
    category:            { type: String, default: '' },
    status:              { type: String, enum: ['draft', 'processing', 'ready', 'failed', 'deleted'], default: 'ready' },
    visibility:          { type: String, enum: ['public', 'private', 'unlisted', 'members_only'], default: 'public' },
    
    // Cloudinary video asset
    cloudinaryPublicId:  { type: String },
    videoUrl:            { type: String },
    hlsUrl:              { type: String },
    fileSizeBytes:       { type: Number, default: 0 },
    mimeType:            { type: String },
    durationSeconds:     { type: Number, default: 0 },

    // Cloudinary thumbnail asset
    thumbnailPublicId:   { type: String },
    thumbnailUrl:        { type: String },

    // Engagement
    viewCount:           { type: Number, default: 0 },
    likeCount:           { type: Number, default: 0 },
    commentCount:        { type: Number, default: 0 },

    publishedAt:         { type: Date },
  },
  { timestamps: true }
);

// Indexes matched from PostgreSQL for faster query performance
videoSchema.index({ ownerId: 1 });
videoSchema.index({ stationId: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ visibility: 1 });
videoSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Video || mongoose.model('Video', videoSchema);
