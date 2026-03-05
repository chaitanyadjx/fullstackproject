const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType:  { type: String, enum: ['video', 'comment', 'post', 'user', 'stream'], required: true },
    reason:      { type: String, required: true },
    description: { type: String, default: '' },
    status:      { type: String, enum: ['open', 'reviewed', 'actioned', 'dismissed'], default: 'open' },
    resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt:  { type: Date, default: null },
    note:        { type: String, default: '' },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1 });
reportSchema.index({ reporterId: 1 });

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
