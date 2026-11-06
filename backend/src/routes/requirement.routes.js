/**
 * ResourceX – Requirement Routes
 * GET    /api/requirements     – list mine
 * POST   /api/requirements     – create
 * DELETE /api/requirements/:id – delete mine
 */
'use strict';

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const reqService     = require('../services/requirement.service');
const { authenticate } = require('../middleware/auth.middleware');
const validate       = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    res.json(await reqService.list(req.user._id));
  } catch (err) { next(err); }
});

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
  validate,
], async (req, res, next) => {
  try {
    const requirement = await reqService.create(req.body, req.user._id);
    res.status(201).json(requirement);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    res.json(await reqService.remove(req.params.id, req.user._id));
  } catch (err) { next(err); }
});

module.exports = router;
