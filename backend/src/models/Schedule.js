const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    creatorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    category:     { type: String, default: '' },
    scheduledAt:  { type: Date, required: true },
    status:       { type: String, enum: ['scheduled', 'live', 'ended', 'canceled'], default: 'scheduled' },
    thumbnailUrl: { type: String, default: null },
    streamId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', default: null },
    isDeleted:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

scheduleSchema.index({ creatorId: 1, scheduledAt: 1 });

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);
