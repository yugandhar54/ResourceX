/**
 * ResourceX – User Model
 * Represents campus students, faculty, and admins.
 */
'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: [true, 'First name is required'], trim: true },
    lastName:   { type: String, required: [true, 'Last name is required'],  trim: true },
    email:      {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    personalEmail: {
      type:     String,
      trim:     true,
      lowercase: true,
      match:    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid personal email'],
    },
    rollNumber: { type: String, required: [true, 'Student/Faculty ID is required'], trim: true },
    department: { type: String, required: [true, 'Department is required'], trim: true },
    role:       {
      type:    String,
      enum:    ['student', 'faculty', 'admin'],
      default: 'student',
    },
    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },
    googleId:   { type: String, sparse: true, index: true },
    avatar:     { type: String, default: '' },
    password:   {
      type: String,
      required: function () {
        return !this.googleId && this.authProvider !== 'google';
      },
      minlength: 8,
      select: false,
    },
    bio:        { type: String, trim: true, maxlength: 500 },
    status:     { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
    rating:     { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:{ type: Number, default: 0 },
    listedCount:{ type: Number, default: 0 },
    interactions:{ type: Number, default: 0 },
    wishlist:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
  },
  { timestamps: true }
);

/* ── Virtual: full name ── */
UserSchema.virtual('name').get(function () {
  if (!this.firstName && !this.lastName) return '';
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

/* ── Virtual: initials ── */
UserSchema.virtual('initials').get(function () {
  const f = (this.firstName && this.firstName[0]) || '';
  const l = (this.lastName && this.lastName[0]) || '';
  return `${f}${l}`.toUpperCase();
});

/* ── Hash password before save ── */
UserSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ── Compare passwords ── */
UserSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

/* ── Safe JSON (strip password) ── */
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  return obj;
};

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
