/**
 * ResourceX – Reservation Routes
 * GET   /api/reservations        – list mine
 * POST  /api/reservations        – create
 * PATCH /api/reservations/:id    – update status
 */
'use strict';

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const reservationService = require('../services/reservation.service');
const { authenticate }   = require('../middleware/auth.middleware');
const validate           = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const reservations = await reservationService.list(req.user._id, req.query);
    res.json(reservations);
  } catch (err) {
    next(err);
  }
});

router.post('/', [
  body('resourceId').notEmpty().withMessage('Resource ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('returnDate').isISO8601().withMessage('Valid return date required'),
  validate,
], async (req, res, next) => {
  try {
    const reservation = await reservationService.create(req.body, req.user._id);
    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', [
  body('status')
    .isIn(['approved','rejected','active','returned','cancelled'])
    .withMessage('Invalid status value'),
  validate,
], async (req, res, next) => {
  try {
    const reservation = await reservationService.updateStatus(
      req.params.id, req.body.status, req.user._id
    );
    res.json(reservation);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
