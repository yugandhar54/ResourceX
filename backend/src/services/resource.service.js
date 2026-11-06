/**
 * ResourceX – Resource Service
 * Full CRUD with filtering, pagination, and moderation.
 */
'use strict';

const Resource = require('../models/Resource.model');
const Notification = require('../models/Notification.model');

const DEFAULT_PAGE_SIZE = 12;

/**
 * List approved resources with optional filtering, search, sort, and pagination.
 * Mirrors the frontend filterResources() function in api.js.
 */
async function list(params = {}) {
  const {
    search, category, type, exchangeMode, availability,
    minPrice, maxPrice, sort, page, pageSize, status,
  } = params;

  // Base filter – only approved resources for normal users
  const filter = {};

  // Admin can see all statuses; normal list only shows 'approved'
  filter.status = status || 'approved';

  if (category && category !== 'all') filter.category = category;
  if (type && type !== 'all')         filter.type = type;
  if (exchangeMode && exchangeMode !== 'all') filter.exchangeMode = exchangeMode;
  if (availability && availability !== 'all') filter.availability = availability;
  if (minPrice !== undefined && minPrice !== '' && minPrice !== 'undefined' && !isNaN(Number(minPrice))) {
    filter.price = { ...filter.price, $gte: Number(minPrice) };
  }
  if (maxPrice !== undefined && maxPrice !== '' && maxPrice !== 'undefined' && !isNaN(Number(maxPrice))) {
    filter.price = { ...filter.price, $lte: Number(maxPrice) };
  }

  let query;

  if (search && search.trim()) {
    // Full-text search via MongoDB text index
    query = Resource.find(
      { ...filter, $text: { $search: search } },
      { score: { $meta: 'textScore' } }
    );
  } else {
    query = Resource.find(filter);
  }

  // Sort
  switch (sort) {
    case 'newest':     query = query.sort({ createdAt: -1 }); break;
    case 'oldest':     query = query.sort({ createdAt: 1 });  break;
    case 'price_asc':  query = query.sort({ price: 1 });      break;
    case 'price_desc': query = query.sort({ price: -1 });     break;
    case 'rating':     query = query.sort({ rating: -1 });    break;
    default:
      if (search && search.trim()) {
        query = query.sort({ score: { $meta: 'textScore' } });
      } else {
        query = query.sort({ views: -1 });
      }
  }

  // Pagination
  const pg     = Math.max(1, parseInt(page) || 1);
  const pgSize = Math.min(50, parseInt(pageSize) || DEFAULT_PAGE_SIZE);
  const skip   = (pg - 1) * pgSize;

  const [items, total] = await Promise.all([
    query.clone().skip(skip).limit(pgSize).populate('owner', 'firstName lastName role department rating'),
    Resource.countDocuments(filter),
  ]);

  const serialised = items.map(r => formatResource(r));

  return {
    items: serialised,
    total,
    page:  pg,
    pageSize: pgSize,
    totalPages: Math.ceil(total / pgSize),
  };
}

/**
 * Get a single approved resource and increment view count.
 */
async function get(id) {
  const resource = await Resource.findById(id)
    .populate('owner', 'firstName lastName role department rating reviewCount bio');

  if (!resource) {
    const err = new Error('Resource not found');
    err.status = 404;
    throw err;
  }

  if (resource.status !== 'approved') {
    const err = new Error('This resource is not yet available.');
    err.status = 403;
    throw err;
  }

  // Increment views (fire-and-forget, don't block response)
  Resource.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec().catch(() => {});

  return formatResource(resource);
}

/**
 * Get resource by ID for the owner (no status restriction).
 */
async function getForOwner(id, userId) {
  const resource = await Resource.findOne({ _id: id, owner: userId })
    .populate('owner', 'firstName lastName role department rating');

  if (!resource) {
    const err = new Error('Resource not found or not owned by you.');
    err.status = 404;
    throw err;
  }

  return formatResource(resource);
}

/**
 * Create a new resource listing (always starts as 'pending').
 */
async function create(data, ownerId) {
  const resource = await Resource.create({
    ...data,
    owner:  ownerId,
    status: 'pending',
  });

  await resource.populate('owner', 'firstName lastName role department rating');
  return formatResource(resource);
}

/**
 * Update an existing resource. Owner-only.
 */
async function update(id, data, userId, userRole) {
  const resource = await Resource.findById(id);

  if (!resource) {
    const err = new Error('Resource not found');
    err.status = 404;
    throw err;
  }

  if (String(resource.owner) !== String(userId) && userRole !== 'admin') {
    const err = new Error('You are not authorized to edit this resource.');
    err.status = 403;
    throw err;
  }

  // Re-submit for moderation if content changed
  const contentFields = ['title', 'description', 'category', 'type', 'exchangeMode'];
  const needsReview   = contentFields.some(f => data[f] !== undefined && data[f] !== resource[f]);
  if (needsReview && userRole !== 'admin') data.status = 'pending';

  // Strip fields that shouldn't be updated externally
  delete data.owner;
  delete data.views;
  delete data.rating;
  delete data.reviewCount;

  Object.assign(resource, data);
  await resource.save();
  await resource.populate('owner', 'firstName lastName role department rating');

  return formatResource(resource);
}

/**
 * Delete a resource. Owner or admin.
 */
async function remove(id, userId, userRole) {
  const resource = await Resource.findById(id);

  if (!resource) {
    const err = new Error('Resource not found');
    err.status = 404;
    throw err;
  }

  if (String(resource.owner) !== String(userId) && userRole !== 'admin') {
    const err = new Error('Not authorized to delete this resource.');
    err.status = 403;
    throw err;
  }

  await Resource.findByIdAndDelete(id);
  return { success: true };
}

/**
 * Get all resources owned by the current user.
 */
async function myResources(userId) {
  const resources = await Resource.find({ owner: userId })
    .sort({ createdAt: -1 })
    .populate('owner', 'firstName lastName role department rating');

  return resources.map(formatResource);
}

/**
 * Admin: get all resources including pending/rejected.
 */
async function adminList(filter = {}) {
  const resources = await Resource.find(filter)
    .sort({ createdAt: -1 })
    .populate('owner', 'firstName lastName email role department');

  return resources.map(formatResource);
}

/**
 * Admin: approve or reject a resource listing.
 */
async function moderate(id, action, adminId, note) {
  const resource = await Resource.findById(id).populate('owner', 'firstName lastName department role rating bio');
  if (!resource) {
    const err = new Error('Resource not found');
    err.status = 404;
    throw err;
  }

  if (!['approved', 'rejected', 'removed'].includes(action)) {
    const err = new Error('Invalid moderation action');
    err.status = 400;
    throw err;
  }

  resource.status        = action;
  resource.moderatedBy   = adminId;
  resource.moderatedAt   = new Date();
  resource.moderationNote = note || '';
  await resource.save();

  // Notify owner
  const messages = {
    approved: `Your resource "${resource.title}" has been approved and is now publicly listed.`,
    rejected:  `Your resource "${resource.title}" was rejected. Reason: ${note || 'Not specified'}`,
    removed:   `Your resource "${resource.title}" has been removed by campus administration.`,
  };

  await Notification.create({
    user:    resource.owner._id,
    type:    'moderation',
    title:   `Listing ${action}`,
    message: messages[action],
    link:    'my-resources.html',
  });

  return formatResource(resource);
}

/* ── Shape the resource to match what the frontend expects ── */
function formatResource(r) {
  const obj = r.toObject ? r.toObject({ virtuals: true }) : r;
  const owner = obj.owner || {};

  return {
    id:            obj._id,
    title:         obj.title,
    description:   obj.description,
    category:      obj.category,
    subject:       obj.subject || obj.department,
    department:    obj.department,
    tags:          obj.tags || [],
    type:          obj.type,
    condition:     obj.condition,
    exchangeMode:  obj.exchangeMode,
    price:         obj.price,
    deposit:       obj.deposit,
    availability:  obj.availability,
    status:        obj.status,
    location:      obj.location,
    images:        obj.images || [],
    thumbnail:     (obj.images && obj.images[0]) || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    fileUrl:       obj.fileUrl,
    fileType:      obj.fileType,
    fileSize:      obj.fileSize,
    ownerId:       owner._id || owner.id,
    ownerName:     owner.firstName ? `${owner.firstName} ${owner.lastName}` : 'Campus User',
    ownerDept:     owner.department || '',
    owner:         owner._id ? {
      id:         owner._id,
      name:       `${owner.firstName} ${owner.lastName}`,
      role:       owner.role,
      department: owner.department,
      rating:     owner.rating,
      bio:        owner.bio,
    } : undefined,
    rating:        obj.rating,
    reviewCount:   obj.reviewCount,
    views:         obj.views,
    createdAt:     obj.createdAt,
    updatedAt:     obj.updatedAt,
    moderationNote: obj.moderationNote,
  };
}

module.exports = { list, get, getForOwner, create, update, remove, myResources, adminList, moderate, formatResource };
