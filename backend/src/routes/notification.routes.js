/**
 * ResourceX – Notification Routes
 * GET  /api/notifications              – list mine
 * PATCH /api/notifications/:id         – mark one read
 * POST /api/notifications/mark-all-read – mark all read
 */
'use strict';

const express = require('express');
const router  = express.Router();

const notifService   = require('../services/notification.service');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    res.json(await notifService.list(req.user._id));
  } catch (err) { next(err); }
});

router.post('/mark-all-read', async (req, res, next) => {
  try {
    res.json(await notifService.markAllRead(req.user._id));
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    res.json(await notifService.markRead(req.params.id, req.user._id));
  } catch (err) { next(err); }
});

module.exports = router;
