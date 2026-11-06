/**
 * ResourceX – Transaction Routes
 * GET /api/transactions       – list mine
 * GET /api/transactions/:id   – get one
 */
'use strict';

const express = require('express');
const router  = express.Router();

const txService      = require('../services/transaction.service');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    res.json(await txService.list(req.user._id));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await txService.get(req.params.id, req.user._id));
  } catch (err) { next(err); }
});

module.exports = router;
