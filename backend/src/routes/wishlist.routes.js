/**
 * ResourceX – Wishlist Routes
 * GET  /api/wishlist              – get my wishlist
 * POST /api/wishlist/toggle       – toggle a resource in/out of wishlist
 */
'use strict';

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const wishlistService = require('../services/wishlist.service');
const { authenticate }  = require('../middleware/auth.middleware');
const validate          = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    res.json(await wishlistService.getWishlist(req.user._id));
  } catch (err) { next(err); }
});

router.post('/toggle', [
  body('resourceId').notEmpty().withMessage('resourceId is required'),
  validate,
], async (req, res, next) => {
  try {
    const result = await wishlistService.toggle(req.body.resourceId, req.user._id);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
