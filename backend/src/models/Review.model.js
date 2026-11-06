/**
 * ResourceX – Review Model
 */
'use strict';

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    resource:    { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating:      { type: Number, required: true, min: 1, max: 5 },
    comment:     { type: String, required: true, trim: true, maxlength: 1000 },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }, // Link to verified exchange
  },
  { timestamps: true }
);

// One review per user per resource
ReviewSchema.index({ resource: 1, author: 1 }, { unique: true });

/* ── After saving/removing a review, recalculate resource rating ── */
async function recalcRating(resourceId) {
  const Resource = require('./Resource.model');
  const agg = await ReviewSchema.model('Review').aggregate([
    { $match: { resource: resourceId } },
    { $group: { _id: '$resource', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const data = agg[0] || { avg: 0, count: 0 };
  await Resource.findByIdAndUpdate(resourceId, {
    rating:      Math.round(data.avg * 10) / 10,
    reviewCount: data.count,
  });
}

ReviewSchema.post('save', async function () {
  await recalcRating(this.resource);
});

ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await recalcRating(doc.resource);
});

module.exports = mongoose.model('Review', ReviewSchema);
