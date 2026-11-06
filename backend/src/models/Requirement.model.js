/**
 * ResourceX – Requirement Model
 * Student/faculty academic resource requirement postings.
 */
'use strict';

const mongoose = require('mongoose');

const RequirementSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User is required'],
    },
    title:       { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 1000 },
    category:    {
      type: String,
      enum: ['books', 'electronics', 'lab', 'materials', 'notes', 'papers', 'slides', 'manuals', 'any'],
      default: 'any',
    },
    preferredType:  { type: String, enum: ['physical', 'digital', 'any'], default: 'any' },
    preferredModes: [{ type: String, enum: ['free', 'borrow', 'sell'] }],
    budget:         { type: Number, default: 0, min: 0 },
    requiredBy:     { type: Date },
    tags:           [{ type: String, trim: true, lowercase: true }],
    status:         { type: String, enum: ['open', 'fulfilled', 'expired'], default: 'open' },
  },
  { timestamps: true }
);

RequirementSchema.index({ user: 1, status: 1 });
RequirementSchema.index({ category: 1, status: 1 });
RequirementSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Requirement', RequirementSchema);
