const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:          { type: String, required: true },   // e.g. 'new_video', 'subscriber', 'comment', 'perk'
    message:       { type: String, required: true },
    isRead:        { type: Boolean, default: false },
    referenceId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceType: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
