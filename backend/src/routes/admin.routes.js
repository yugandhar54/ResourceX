/**
 * ResourceX – Admin Routes
 * GET   /api/admin/users             – list all users
 * PATCH /api/admin/users/:id         – update user status
 * GET   /api/admin/analytics         – platform analytics
 * GET   /api/admin/resources         – all resources (any status)
 * PATCH /api/admin/resources/:id/moderate – approve/reject/remove listing
 */
'use strict';

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const adminService    = require('../services/admin.service');
const resourceService = require('../services/resource.service');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

/* ── Users ── */
router.get('/users', async (req, res, next) => {
  try {
    res.json(await adminService.listUsers(req.query));
  } catch (err) { next(err); }
});

router.patch('/users/:id', [
  body('status').isIn(['active', 'suspended']).withMessage('Status must be active or suspended'),
  validate,
], async (req, res, next) => {
  try {
    const user = await adminService.updateUserStatus(req.params.id, req.body.status, req.user._id);
    res.json(user);
  } catch (err) { next(err); }
});

router.delete('/users', async (req, res, next) => {
  try {
    const result = await adminService.deleteAllUsers(req.query.preserveAdmin === 'true' ? req.user._id : null);
    res.json(result);
  } catch (err) { next(err); }
});

/* ── Analytics ── */
router.get('/analytics', async (req, res, next) => {
  try {
    res.json(await adminService.getAnalytics());
  } catch (err) { next(err); }
});

/* ── Resources (all statuses) ── */
router.get('/resources', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const resources = await resourceService.adminList(filter);
    res.json(resources);
  } catch (err) { next(err); }
});

/* ── Moderation ── */
router.patch('/resources/:id/moderate', [
  body('action').isIn(['approved','rejected','removed']).withMessage('Invalid action'),
  validate,
], async (req, res, next) => {
  try {
    const resource = await resourceService.moderate(
      req.params.id, req.body.action, req.user._id, req.body.note
    );
    res.json(resource);
  } catch (err) { next(err); }
});

module.exports = router;
