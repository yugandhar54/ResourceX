/**
 * ResourceX – Notification Model
 */
'use strict';

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, enum: ['reservation', 'match', 'transaction', 'system', 'review', 'moderation'], default: 'system' },
    title:   { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link:    { type: String },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
