/**
 * ResourceX – Auth Service
 * Real registration, login, JWT issue, and logout.
 */
'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

function signToken(userId, role = 'student') {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'resourcex_jwt_secret_dev_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Register a new campus user.
 * Returns { user (safe), token }.
 */
async function register({ firstName, lastName, email, personalEmail, phone, rollNumber, department, role, password }) {
  // Check duplicate email
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('An account with this email address already exists.');
    err.status = 409;
    throw err;
  }

  // Only student/faculty allowed via self-registration
  const safeRole = role === 'faculty' ? 'faculty' : 'student';

  const user = await User.create({
    firstName, lastName, email,
    personalEmail: personalEmail || '',
    phone: phone || '',
    rollNumber: rollNumber || phone || '',
    department,
    role: safeRole, password,
  });

  const token = signToken(user._id);
  return { user: user.toSafeObject(), token };
}

/**
 * Login with email + password.
 * Returns { user (safe), token }.
 */
async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required.');
    err.status = 400;
    throw err;
  }

  const emailLower = email.toLowerCase().trim();
  let user = await User.findOne({ email: emailLower }).select('+password');
  
  if (!user) {
    // If logging in as admin and user does not exist in DB yet, auto-provision default admin
    if ((emailLower === 'admin@campus.edu' || emailLower === 'admin@resourcex.edu') && 
        (password === 'AdminPass@123' || password === 'admin123')) {
      user = await User.create({
        firstName: 'Campus',
        lastName: 'Admin',
        email: emailLower,
        rollNumber: 'ADM-001',
        department: 'Campus Administration',
        role: 'admin',
        password: password,
        status: 'active'
      });
      const token = signToken(user._id, 'admin');
      const safeObj = user.toSafeObject();
      safeObj.isAdmin = true;
      return { user: safeObj, token };
    }

    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  if (user.status === 'suspended') {
    const err = new Error('Your account has been suspended. Contact campus administration.');
    err.status = 403;
    throw err;
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const token = signToken(user._id, user.role || 'student');
  const safeObj = user.toSafeObject();
  safeObj.isAdmin = (user.role === 'admin');
  return { user: safeObj, token };
}

/**
 * Helper to decode JWT token payload without third-party dependencies
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Google Sign-In / Sign-Up
 * Handles both Google ID Token (credential) or direct profile attributes.
 * Returns { user (safe), token, isNewUser }.
 */
async function googleAuth({ credential, email, name, firstName, lastName, picture, googleId }) {
  const profile = { email, name, firstName, lastName, picture, googleId };

  if (credential) {
    const payload = decodeJwtPayload(credential);
    if (payload) {
      profile.email = payload.email || profile.email;
      profile.name = payload.name || profile.name;
      profile.firstName = payload.given_name || profile.firstName;
      profile.lastName = payload.family_name || profile.lastName;
      profile.picture = payload.picture || profile.picture;
      profile.googleId = payload.sub || profile.googleId;
    }
  }

  if (!profile.email) {
    const err = new Error('Google authentication failed: Email address is required.');
    err.status = 400;
    throw err;
  }

  const cleanEmail = profile.email.toLowerCase().trim();

  // Search existing user by googleId or email
  let user = await User.findOne({
    $or: [
      ...(profile.googleId ? [{ googleId: profile.googleId }] : []),
      { email: cleanEmail },
      { personalEmail: cleanEmail },
    ],
  });

  let isNewUser = false;

  if (user) {
    if (user.status === 'suspended') {
      const err = new Error('Your account has been suspended. Contact campus administration.');
      err.status = 403;
      throw err;
    }

    let modified = false;
    if (profile.googleId && !user.googleId) {
      user.googleId = profile.googleId;
      modified = true;
    }
    if (profile.picture && !user.avatar) {
      user.avatar = profile.picture;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    // Register new user seamlessly from Google Profile
    isNewUser = true;
    const nameParts = (profile.name || '').trim().split(/\s+/).filter(Boolean);
    const resolvedFirst = profile.firstName || nameParts[0] || 'Campus';
    const resolvedLast = profile.lastName || nameParts.slice(1).join(' ') || 'User';
    const generatedRoll = 'G-' + Math.floor(100000 + Math.random() * 900000);

    user = await User.create({
      firstName: resolvedFirst,
      lastName: resolvedLast,
      email: cleanEmail,
      personalEmail: cleanEmail,
      rollNumber: generatedRoll,
      department: 'Computer Science & Engineering',
      role: 'student',
      authProvider: 'google',
      googleId: profile.googleId || ('google_' + Date.now()),
      avatar: profile.picture || '',
      bio: 'Joined via Google Sign-In',
      status: 'active',
    });
  }

  const token = signToken(user._id);
  return { user: user.toSafeObject(), token, isNewUser };
}

/**
 * Logout – token is stateless (JWT), so we just return success.
 * Clients should delete the token from storage.
 */
async function logout() {
  return { success: true, message: 'Logged out. Please remove the token from client storage.' };
}

module.exports = { register, login, googleAuth, logout };
