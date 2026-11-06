/**
 * ResourceX – Notification Service
 */
'use strict';

const Notification = require('../models/Notification.model');

async function list(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
}

async function markRead(id, userId) {
  const n = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { read: true },
    { new: true }
  );
  if (!n) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  return { success: true };
}

async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
  return { success: true };
}

module.exports = { list, markRead, markAllRead };
