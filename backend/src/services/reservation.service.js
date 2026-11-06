/**
 * ResourceX – Reservation Service
 * Borrow request lifecycle: create → approve/reject → active → returned.
 */
'use strict';

const Reservation  = require('../models/Reservation.model');
const Resource     = require('../models/Resource.model');
const Transaction  = require('../models/Transaction.model');
const Notification = require('../models/Notification.model');

/**
 * List reservations for the current user (both as requester and owner).
 */
async function list(userId, params = {}) {
  const filter = {
    $or: [{ requester: userId }, { owner: userId }],
  };

  if (params.status && params.status !== 'all') {
    filter.status = params.status;
  }

  const reservations = await Reservation.find(filter)
    .sort({ createdAt: -1 })
    .populate('resource',  'title category type exchangeMode')
    .populate('requester', 'firstName lastName department')
    .populate('owner',     'firstName lastName department');

  return reservations.map(formatReservation);
}

/**
 * Create a new reservation request.
 */
async function create(data, requesterId) {
  const { resourceId, startDate, returnDate, notes } = data;

  const resource = await Resource.findById(resourceId);
  if (!resource) {
    const err = new Error('Resource not found');
    err.status = 404;
    throw err;
  }

  if (resource.status !== 'approved') {
    const err = new Error('This resource is not available for reservation.');
    err.status = 400;
    throw err;
  }

  if (resource.availability !== 'available') {
    const err = new Error('This resource is currently not available.');
    err.status = 409;
    throw err;
  }

  if (String(resource.owner) === String(requesterId)) {
    const err = new Error('You cannot reserve your own resource.');
    err.status = 400;
    throw err;
  }

  // Validate dates
  const start  = new Date(startDate);
  const end    = new Date(returnDate);
  const today  = new Date(); today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const err = new Error('Invalid dates provided.');
    err.status = 400;
    throw err;
  }

  if (start < today) {
    const err = new Error('Start date cannot be in the past.');
    err.status = 400;
    throw err;
  }

  if (end <= start) {
    const err = new Error('Return date must be after start date.');
    err.status = 400;
    throw err;
  }

  const reservation = await Reservation.create({
    resource:   resourceId,
    requester:  requesterId,
    owner:      resource.owner,
    startDate:  start,
    returnDate: end,
    status:     'pending',
    type:       resource.exchangeMode,
    notes:      notes || '',
  });

  // Notify resource owner
  await Notification.create({
    user:    resource.owner,
    type:    'reservation',
    title:   'Borrow request received',
    message: `Someone wants to borrow your "${resource.title}".`,
    link:    'reservations.html',
  });

  await reservation.populate([
    { path: 'resource',  select: 'title category type exchangeMode' },
    { path: 'requester', select: 'firstName lastName department' },
    { path: 'owner',     select: 'firstName lastName department' },
  ]);

  return formatReservation(reservation);
}

/**
 * Update reservation status (approve / reject / active / returned / cancelled).
 * Enforces role-based transitions.
 */
async function updateStatus(reservationId, newStatus, userId) {
  const reservation = await Reservation.findById(reservationId)
    .populate('resource', 'title owner');

  if (!reservation) {
    const err = new Error('Reservation not found');
    err.status = 404;
    throw err;
  }

  const isOwner     = String(reservation.owner) === String(userId);
  const isRequester = String(reservation.requester) === String(userId);

  // Define allowed transitions per role
  const ownerAllowed     = ['approved', 'rejected', 'active'];
  const requesterAllowed = ['cancelled'];
  const eitherAllowed    = ['returned'];

  const allowed =
    (isOwner     && ownerAllowed.includes(newStatus))  ||
    (isRequester && requesterAllowed.includes(newStatus)) ||
    ((isOwner || isRequester) && eitherAllowed.includes(newStatus));

  if (!allowed) {
    const err = new Error('You are not authorized to perform this status transition.');
    err.status = 403;
    throw err;
  }

  // Validate state machine
  const transitions = {
    pending:  ['approved', 'rejected', 'cancelled'],
    approved: ['active', 'cancelled'],
    active:   ['returned', 'cancelled'],
    returned: [],
    rejected: [],
    cancelled:[],
  };

  if (!transitions[reservation.status]?.includes(newStatus)) {
    const err = new Error(
      `Cannot transition from '${reservation.status}' to '${newStatus}'.`
    );
    err.status = 400;
    throw err;
  }

  reservation.status = newStatus;

  // Side-effects
  if (newStatus === 'active') {
    reservation.handedOverAt = new Date();
    await Resource.findByIdAndUpdate(reservation.resource._id, { availability: 'borrowed' });
  }

  if (newStatus === 'returned') {
    reservation.returnedAt = new Date();
    await Resource.findByIdAndUpdate(reservation.resource._id, { availability: 'available' });

    // Create a completed transaction record
    await Transaction.create({
      resource:        reservation.resource._id,
      resourceTitle:   reservation.resource.title,
      initiator:       reservation.requester,
      counterpart:     reservation.owner,
      type:            reservation.type === 'borrow' ? 'borrow' : 'free',
      amount:          0,
      status:          'completed',
      reservation:     reservation._id,
    });

    // Notify requester to leave a review
    await Notification.create({
      user:    reservation.requester,
      type:    'review',
      title:   'How was your experience?',
      message: `Please leave a review for "${reservation.resource.title}".`,
      link:    `resource-details.html?id=${reservation.resource._id}#reviews-list`,
    });
  }

  if (newStatus === 'rejected') {
    await Notification.create({
      user:    reservation.requester,
      type:    'reservation',
      title:   'Borrow request declined',
      message: `Your request for "${reservation.resource.title}" was declined.`,
      link:    'reservations.html',
    });
  }

  if (newStatus === 'approved') {
    await Notification.create({
      user:    reservation.requester,
      type:    'reservation',
      title:   'Borrow request approved!',
      message: `Your request for "${reservation.resource.title}" was approved. Arrange pickup with the owner.`,
      link:    'reservations.html',
    });
  }

  await reservation.save();

  await reservation.populate([
    { path: 'resource',  select: 'title category type exchangeMode' },
    { path: 'requester', select: 'firstName lastName department' },
    { path: 'owner',     select: 'firstName lastName department' },
  ]);

  return formatReservation(reservation);
}

function formatReservation(r) {
  const obj = r.toObject ? r.toObject() : r;
  const res   = obj.resource || {};
  const req   = obj.requester || {};
  const owner = obj.owner || {};

  return {
    id:            obj._id,
    resourceId:    res._id || res,
    resourceTitle: res.title || '',
    requesterId:   req._id || req,
    requesterName: req.firstName ? `${req.firstName} ${req.lastName}` : '',
    ownerId:       owner._id || owner,
    ownerName:     owner.firstName ? `${owner.firstName} ${owner.lastName}` : '',
    startDate:     obj.startDate,
    returnDate:    obj.returnDate,
    status:        obj.status,
    type:          obj.type,
    notes:         obj.notes,
    handedOverAt:  obj.handedOverAt,
    returnedAt:    obj.returnedAt,
    createdAt:     obj.createdAt,
  };
}

module.exports = { list, create, updateStatus };
