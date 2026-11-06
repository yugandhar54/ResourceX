/**
 * ResourceX – Reservation Model
 * Tracks borrow/lend requests between campus peers.
 */
'use strict';

const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema(
  {
    resource: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Resource',
      required: [true, 'Resource is required'],
    },
    requester: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Requester is required'],
    },
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Owner is required'],
    },

    startDate:  { type: Date, required: [true, 'Start date is required'] },
    returnDate: { type: Date, required: [true, 'Return date is required'] },

    status: {
      type:    String,
      enum:    ['pending', 'approved', 'active', 'returned', 'rejected', 'cancelled'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['borrow', 'sell', 'free'],
      default: 'borrow',
    },

    notes:          { type: String, trim: true, maxlength: 500 },
    rejectionReason:{ type: String, trim: true },
    returnedAt:     { type: Date },
    handedOverAt:   { type: Date },
  },
  { timestamps: true }
);

ReservationSchema.index({ requester: 1, status: 1 });
ReservationSchema.index({ owner: 1, status: 1 });
ReservationSchema.index({ resource: 1, status: 1 });

module.exports = mongoose.model('Reservation', ReservationSchema);
