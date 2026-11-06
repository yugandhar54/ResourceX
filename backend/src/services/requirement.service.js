/**
 * ResourceX – Requirement Service
 */
'use strict';

const Requirement = require('../models/Requirement.model');

async function list(userId) {
  return Requirement.find({ user: userId }).sort({ createdAt: -1 });
}

async function create(data, userId) {
  const requirement = await Requirement.create({ ...data, user: userId });
  return requirement;
}

async function remove(id, userId) {
  const req = await Requirement.findOneAndDelete({ _id: id, user: userId });
  if (!req) {
    const err = new Error('Requirement not found or not owned by you.');
    err.status = 404;
    throw err;
  }
  return { success: true };
}

module.exports = { list, create, remove };
