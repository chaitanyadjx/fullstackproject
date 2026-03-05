const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema(
  {
    newContentAlerts: { type: Boolean, default: true },
    communityReplies:  { type: Boolean, default: true },
    exclusivePerks:    { type: Boolean, default: true },
    weeklyDigest:      { type: Boolean, default: true },
    billingReceipts:   { type: Boolean, default: true },
    productUpdates:    { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName:             { type: String, required: true, trim: true },
    email:                { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:         { type: String, required: true },
    role:                 { type: String, enum: ['viewer', 'creator', 'admin'], default: 'viewer' },
    avatarUrl:            { type: String, default: null },
    bio:                  { type: String, default: '' },
    username:             { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    displayName:          { type: String, default: '' },
    isEmailVerified:      { type: Boolean, default: false },
    passwordResetToken:   { type: String, default: null },
    passwordResetExpires: { type: Date,   default: null },
    notificationSettings: { type: notificationSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
