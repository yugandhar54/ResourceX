/**
 * ResourceX – Review Service
 */
'use strict';

const Review    = require('../models/Review.model');
const Reservation = require('../models/Reservation.model');

async function getReviews(resourceId) {
  const reviews = await Review.find({ resource: resourceId })
    .sort({ createdAt: -1 })
    .populate('author', 'firstName lastName');

  return reviews.map(rv => ({
    id:       rv._id,
    resourceId: rv.resource,
    userId:   rv.author?._id,
    userName: rv.author ? `${rv.author.firstName} ${rv.author.lastName}` : 'Campus Student',
    author:   rv.author ? `${rv.author.firstName} ${rv.author.lastName}` : 'Campus Student',
    rating:   rv.rating,
    comment:  rv.comment,
    date:     rv.createdAt,
  }));
}

async function createReview(resourceId, userId, { rating, comment }) {
  // Check user hasn't already reviewed this resource
  const existing = await Review.findOne({ resource: resourceId, author: userId });
  if (existing) {
    const err = new Error('You have already reviewed this resource.');
    err.status = 409;
    throw err;
  }

  const review = await Review.create({
    resource: resourceId,
    author:   userId,
    rating,
    comment,
  });

  await review.populate('author', 'firstName lastName');

  return {
    id:       review._id,
    resourceId: review.resource,
    userId:   review.author?._id,
    author:   review.author ? `${review.author.firstName} ${review.author.lastName}` : 'You',
    rating:   review.rating,
    comment:  review.comment,
    date:     review.createdAt,
  };
}

module.exports = { getReviews, createReview };
