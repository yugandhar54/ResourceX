/**
 * ResourceX – Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
'use strict';

const express   = require('express');
const { body }  = require('express-validator');
const router    = express.Router();

const authService  = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');
const validate     = require('../middleware/validate.middleware');

/* ── Register ── */
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email address required'),
  body('personalEmail').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid personal email required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required for resource contacts'),
  body('rollNumber').optional({ checkFalsy: true }).trim(),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validate,
], async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/* ── Login ── */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ── Google Login / Register ── */
router.post('/google', async (req, res, next) => {
  try {
    const result = await authService.googleAuth(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ── Logout ── */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const result = await authService.logout();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ── Get current user ── */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
});

module.exports = router;
