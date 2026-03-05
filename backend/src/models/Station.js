const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    ownerId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name:              { type: String, default: '' },   // display name / station title
    bio:               { type: String, default: '' },
    category:          { type: String, default: '' },
    avatarUrl:         { type: String, default: null },
    bannerUrl:         { type: String, default: null },
    tags:              [{ type: String }],
    streamKey:         { type: String, default: null },
    subscriberCount:   { type: Number, default: 0 },
    isLive:            { type: Boolean, default: false },
    membershipsActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Station || mongoose.model('Station', stationSchema);
