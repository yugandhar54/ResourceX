/**
 * ResourceX – Wishlist Service
 * Wishlist is stored as an array of resource IDs on the User document.
 */
'use strict';

const User     = require('../models/User.model');
const Resource = require('../models/Resource.model');
const { formatResource } = require('./resource.service');

async function getWishlist(userId) {
  const user = await User.findById(userId).populate({
    path:     'wishlist',
    match:    { status: 'approved' },
    populate: { path: 'owner', select: 'firstName lastName department rating' },
  });

  return (user?.wishlist || []).map(r => formatResource(r));
}

async function toggle(resourceId, userId) {
  const user = await User.findById(userId);
  const strId = String(resourceId);
  const idx  = user.wishlist.findIndex(id => String(id) === strId);

  if (idx === -1) {
    // Verify resource exists before adding
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.status !== 'approved') {
      const err = new Error('Resource not found');
      err.status = 404;
      throw err;
    }
    user.wishlist.push(resource._id);
    await user.save();
    return { added: true, wishlisted: true, resourceId: strId };
  } else {
    user.wishlist.splice(idx, 1);
    await user.save();
    return { added: false, wishlisted: false, resourceId: strId };
  }
}

async function isWishlisted(resourceId, userId) {
  const user = await User.findById(userId).select('wishlist');
  return {
    wishlisted: user?.wishlist.some(id => String(id) === String(resourceId)) || false,
  };
}

module.exports = { getWishlist, toggle, isWishlisted };
