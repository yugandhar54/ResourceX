/**
 * ResourceX – express-validator Error Formatter
 * Returns a consistent { message, errors } shape on validation failure.
 */
'use strict';

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map(e => ({
    field:   e.path || e.param,
    message: e.msg,
  }));

  return res.status(400).json({
    message: 'Validation failed',
    errors:  formatted,
  });
}

module.exports = validate;
