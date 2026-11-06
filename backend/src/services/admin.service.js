/**
 * ResourceX – Admin Service
 * User management and analytics aggregations.
 */
'use strict';

const User        = require('../models/User.model');
const Resource    = require('../models/Resource.model');
const Reservation = require('../models/Reservation.model');
const Transaction = require('../models/Transaction.model');

async function listUsers(params = {}) {
  const { role, status, search } = params;
  const filter = {};
  if (role   && role   !== 'all') filter.role   = role;
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const q = new RegExp(search, 'i');
    filter.$or = [{ firstName: q }, { lastName: q }, { email: q }, { department: q }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).select('-password');
  return users.map(u => {
    const obj = u.toObject({ virtuals: true });
    delete obj.password;
    return obj;
  });
}

async function updateUserStatus(userId, status, adminId) {
  if (String(userId) === String(adminId)) {
    const err = new Error('You cannot modify your own account status.');
    err.status = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return user.toObject({ virtuals: true });
}

async function getAnalytics() {
  const [
    totalUsers,
    totalResources,
    physicalResources,
    digitalResources,
    pendingListings,
    activeReservations,
    completedTransactions,
    resourcesByCategory,
    monthlyListings,
    monthlyReservations,
  ] = await Promise.all([
    User.countDocuments(),
    Resource.countDocuments({ status: 'approved' }),
    Resource.countDocuments({ status: 'approved', type: 'physical' }),
    Resource.countDocuments({ status: 'approved', type: 'digital' }),
    Resource.countDocuments({ status: 'pending' }),
    Reservation.countDocuments({ status: { $in: ['active', 'approved'] } }),
    Transaction.countDocuments({ status: 'completed' }),

    // Resources by category
    Resource.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),

    // Monthly new listings (last 12 months)
    Resource.aggregate([
      { $match: { status: 'approved', createdAt: { $gte: new Date(Date.now() - 365 * 86400000) } } },
      { $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Monthly reservations (last 12 months)
    Reservation.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 86400000) } } },
      { $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  // Format category map
  const categoryMap = {};
  for (const c of resourcesByCategory) {
    const labels = {
      books: 'Books & Textbooks', electronics: 'Electronics & IoT',
      lab: 'Lab Equipment', materials: 'Project Materials',
      notes: 'Notes & PDFs', papers: 'Question Papers',
      slides: 'Presentations', manuals: 'Lab Manuals',
    };
    categoryMap[labels[c._id] || c._id] = c.count;
  }

  return {
    totalUsers,
    totalResources,
    physicalResources,
    digitalResources,
    pendingListings,
    activeReservations,
    completedTransactions,
    resourcesByCategory: categoryMap,
    monthlyListings:     monthlyListings.map(m => m.count),
    monthlyReservations: monthlyReservations.map(m => m.count),
  };
}

async function deleteAllUsers(adminId = null) {
  // If adminId provided, preserve the calling admin or delete all users
  const filter = adminId ? { _id: { $ne: adminId } } : {};
  const res = await User.deleteMany(filter);
  return { success: true, deletedCount: res.deletedCount };
}

module.exports = { listUsers, updateUserStatus, deleteAllUsers, getAnalytics };
