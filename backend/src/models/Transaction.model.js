/**
 * ResourceX – Transaction Model
 * Records completed resource exchanges.
 */
'use strict';

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Resource',
    },
    resourceTitle: { type: String },            // Snapshot in case resource is deleted

    initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    counterpart:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    counterpartName: { type: String },          // Snapshot

    type: {
      type: String,
      enum: ['borrow', 'lend', 'buy', 'sell', 'free'],
      required: true,
    },
    amount:  { type: Number, default: 0, min: 0 },
    status:  {
      type:    String,
      enum:    ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },

    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
    notes:       { type: String, trim: true },
    date:        { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TransactionSchema.index({ initiator: 1, status: 1 });
TransactionSchema.index({ counterpart: 1, status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
