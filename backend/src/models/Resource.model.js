/**
 * ResourceX – Resource Model
 * Campus academic resources: physical items & digital files.
 */
'use strict';

const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Title is required'],
      trim:     true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type:     String,
      required: [true, 'Description is required'],
      trim:     true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum:     ['books', 'electronics', 'lab', 'materials', 'notes', 'papers', 'slides', 'manuals', 'calculators', 'stationery', 'other'],
    },
    subject: { type: String, trim: true },
    department: { type: String, trim: true },
    tags:     [{ type: String, trim: true, lowercase: true }],

    type: {
      type:     String,
      required: [true, 'Resource type is required'],
      enum:     ['physical', 'digital'],
    },
    condition: {
      type:    String,
      enum:    ['Excellent', 'Good', 'Fair', 'Poor', 'N/A', 'like-new', 'good', 'fair', 'usable', 'Like New', 'Usable'],
      default: 'Good',
      set: function(v) {
        if (!v) return 'Good';
        const c = String(v).toLowerCase().trim();
        if (c === 'like-new' || c === 'like new' || c === 'excellent') return 'Excellent';
        if (c === 'good') return 'Good';
        if (c === 'fair' || c === 'usable' || c === 'poor') return 'Fair';
        if (c === 'n/a') return 'N/A';
        return v;
      },
    },
    exchangeMode: {
      type:     String,
      required: [true, 'Exchange mode is required'],
      enum:     ['free', 'borrow', 'sell'],
    },
    price:   { type: Number, default: 0, min: 0 },
    deposit: { type: Number, default: 0, min: 0 },

    availability: {
      type:    String,
      enum:    ['available', 'borrowed', 'sold', 'reserved'],
      default: 'available',
    },
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected', 'removed', 'available', 'borrowed', 'sold', 'reserved'],
      default: 'pending',
      set: function(v) {
        if (['available', 'borrowed', 'sold', 'reserved'].includes(v)) {
          this.availability = v;
          return 'pending';
        }
        return v || 'pending';
      },
    },

    location: { type: String, trim: true },
    images:   [{ type: String }],
    fileUrl:  { type: String },
    fileType: { type: String },
    fileSize: { type: String },

    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Owner is required'],
    },

    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    views:       { type: Number, default: 0 },

    moderationNote: { type: String, trim: true },
    moderatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt:    { type: Date },
  },
  { timestamps: true }
);

/* ── Pre-validate hook to clean & normalize values ── */
ResourceSchema.pre('validate', function(next) {
  if (this.condition) {
    const c = String(this.condition).toLowerCase().trim();
    if (c === 'like-new' || c === 'like new' || c === 'excellent') this.condition = 'Excellent';
    else if (c === 'good') this.condition = 'Good';
    else if (c === 'fair') this.condition = 'Fair';
    else if (c === 'usable' || c === 'poor') this.condition = 'Fair';
    else if (c === 'n/a') this.condition = 'N/A';
  }
  if (['available', 'borrowed', 'sold', 'reserved'].includes(this.status)) {
    this.availability = this.status;
    this.status = 'approved';
  }
  next();
});

/* ── Indexes for common query patterns ── */
ResourceSchema.index({ status: 1, availability: 1 });
ResourceSchema.index({ category: 1 });
ResourceSchema.index({ owner: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index({ title: 'text', description: 'text', subject: 'text' });

module.exports = mongoose.model('Resource', ResourceSchema);
