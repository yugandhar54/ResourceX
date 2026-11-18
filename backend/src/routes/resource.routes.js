/**
 * ResourceX – Resource Routes
 * GET    /api/resources           – list (public, approved only)
 * GET    /api/resources/mine      – my resources (auth)
 * GET    /api/resources/:id       – get one (public, approved only)
 * POST   /api/resources           – create (auth)
 * PUT    /api/resources/:id       – update (auth, owner)
 * DELETE /api/resources/:id       – delete (auth, owner or admin)
 */
'use strict';

const express  = require('express');
const { body, query } = require('express-validator');
const router   = express.Router();

const resourceService = require('../services/resource.service');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

/* ── List ── */
router.get('/', async (req, res, next) => {
  try {
    const result = await resourceService.list(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ── My resources ── */
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const resources = await resourceService.myResources(req.user._id);
    res.json(resources);
  } catch (err) {
    next(err);
  }
});

/* ── Get single resource ── */
router.get('/:id', async (req, res, next) => {
  try {
    const resource = await resourceService.get(req.params.id);
    res.json(resource);
  } catch (err) {
    next(err);
  }
});

/* ── Create ── */
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('category').isIn(['books','electronics','lab','materials','notes','papers','slides','manuals','calculators','stationery','other'])
    .withMessage('Invalid category'),
  body('type').isIn(['physical','digital']).withMessage('Type must be physical or digital'),
  body('exchangeMode').isIn(['free','borrow','sell']).withMessage('Invalid exchange mode'),
  body('price').optional({ nullable: true }).custom(v => v === undefined || v === null || v === '' || !isNaN(Number(v))).withMessage('Price must be a valid number'),
  validate,
], async (req, res, next) => {
  try {
    const resource = await resourceService.create(req.body, req.user._id);
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
});

/* ── Update ── */
router.put('/:id', authenticate, [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().notEmpty().isLength({ max: 2000 }),
  body('price').optional().isFloat({ min: 0 }),
  validate,
], async (req, res, next) => {
  try {
    const resource = await resourceService.update(
      req.params.id, req.body, req.user._id, req.user.role
    );
    res.json(resource);
  } catch (err) {
    next(err);
  }
});

/* ── Delete ── */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await resourceService.remove(
      req.params.id, req.user._id, req.user.role
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
