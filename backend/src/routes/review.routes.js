/**
 * ResourceX – Review Routes (nested under resources)
 * GET  /api/resources/:id/reviews   – get reviews for a resource
 * POST /api/resources/:id/reviews   – add a review (auth)
 */
'use strict';

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const reviewService = require('../services/review.service');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await reviewService.getReviews(req.params.id);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1000 }),
  validate,
], async (req, res, next) => {
  try {
    const review = await reviewService.createReview(
      req.params.id,
      req.user._id,
      req.body
    );
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
