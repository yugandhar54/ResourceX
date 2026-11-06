/**
 * ResourceX – Transaction Service
 */
'use strict';

const Transaction = require('../models/Transaction.model');

async function list(userId) {
  const transactions = await Transaction.find({
    $or: [{ initiator: userId }, { counterpart: userId }],
  })
    .sort({ date: -1 })
    .populate('resource',    'title category')
    .populate('initiator',   'firstName lastName')
    .populate('counterpart', 'firstName lastName');

  return transactions.map(t => formatTransaction(t, userId));
}

async function get(id, userId) {
  const tx = await Transaction.findById(id)
    .populate('resource',    'title category')
    .populate('initiator',   'firstName lastName')
    .populate('counterpart', 'firstName lastName');

  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }

  // Only participants may view
  if (
    String(tx.initiator?._id) !== String(userId) &&
    String(tx.counterpart?._id) !== String(userId)
  ) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  return formatTransaction(tx, userId);
}

function formatTransaction(tx, viewerId) {
  const obj = tx.toObject ? tx.toObject() : tx;

  const init  = obj.initiator  || {};
  const count = obj.counterpart || {};
  const res   = obj.resource   || {};

  // Determine type from viewer's perspective
  const isInitiator = String(init._id || init) === String(viewerId);
  const perspectiveType = isInitiator ? obj.type : invertType(obj.type);
  const counterpartName = isInitiator
    ? (count.firstName ? `${count.firstName} ${count.lastName}` : 'Campus Peer')
    : (init.firstName  ? `${init.firstName} ${init.lastName}`  : 'Campus Peer');

  return {
    id:            obj._id,
    resourceId:    res._id || res,
    resourceTitle: obj.resourceTitle || res.title || 'Academic Resource',
    counterpart:   counterpartName,
    type:          perspectiveType,
    amount:        obj.amount,
    status:        obj.status,
    date:          obj.date || obj.createdAt,
    notes:         obj.notes,
  };
}

function invertType(type) {
  const inv = { borrow: 'lend', lend: 'borrow', buy: 'sell', sell: 'buy', free: 'free' };
  return inv[type] || type;
}

module.exports = { list, get };
