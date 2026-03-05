const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema(
  {
    ownerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    title:          { type: String, required: true },
    description:    { type: String, default: '' },
    category:       { type: String, default: '' },
    tags:           [{ type: String }],
    status:         { type: String, enum: ['offline', 'live', 'ended'], default: 'offline' },
    streamKey:      { type: String, unique: true },
    playbackUrl:    { type: String },
    thumbnailUrl:   { type: String },
    viewerCount:    { type: Number, default: 0 },
    peakViewers:    { type: Number, default: 0 },
    startedAt:      { type: Date },
    endedAt:        { type: Date },
  },
  { timestamps: true }
);

streamSchema.index({ ownerId: 1 });
streamSchema.index({ stationId: 1 });
streamSchema.index({ status: 1 });

module.exports = mongoose.models.Stream || mongoose.model('Stream', streamSchema);
