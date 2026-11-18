/**
 * ResourceX – Database Seeder
 * Seeds clean platform data: real accounts only (no fake campus users, exchanges, or reviews).
 * Run: node src/scripts/seed.js
 */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const bcrypt       = require('bcryptjs');
const User         = require('../models/User.model');
const Resource     = require('../models/Resource.model');
const Reservation  = require('../models/Reservation.model');
const Transaction  = require('../models/Transaction.model');
const Notification = require('../models/Notification.model');
const Requirement  = require('../models/Requirement.model');
const Review       = require('../models/Review.model');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resourcex');
  console.log('Connected to MongoDB. Seeding clean platform data...\n');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    Reservation.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
    Requirement.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('✓ Cleared all collections (no fake users, exchanges, or reports data)');

  /* ── Verified Users (No fake campus users) ── */
  const defaultPw = await bcrypt.hash('Password@123', 12);
  const adminPw   = await bcrypt.hash('AdminPass@123', 12);

  const users = await User.insertMany([
    {
      firstName: 'Yugandhar',
      lastName: 'Chandu',
      email: 'yugandhar23@lpu.in',
      personalEmail: 'yugandharchandu54@gmail.com',
      phone: '+91 9876543210',
      rollNumber: '12318361',
      department: 'Computer Science & Engineering',
      role: 'student',
      password: defaultPw,
      rating: 5.0,
      interactions: 0
    },
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@campus.edu',
      phone: '+91 9800000000',
      rollNumber: 'ADM-001',
      department: 'Administration',
      role: 'admin',
      password: adminPw
    },
  ]);
  console.log(`✓ Seeded ${users.length} verified accounts (Primary Student & Platform Admin)`);

  const [yugandhar, admin] = users;

  /* ── Resources (Attributed to verified account, awaiting admin approval or approved) ── */
  const resources = await Resource.insertMany([
    {
      title: 'Data Structures & Algorithms – 3rd Edition',
      description: 'Comprehensive textbook by Cormen et al. (CLRS). Lightly used, all pages intact.',
      category: 'books', subject: 'Computer Science',
      tags: ['algorithms', 'data structures', 'CLRS', 'textbook'],
      type: 'physical', condition: 'Good', exchangeMode: 'borrow',
      price: 0, deposit: 100, availability: 'available',
      location: 'CS Block, Room 204', owner: yugandhar._id,
      images: [
        'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 5.0, reviewCount: 0, views: 0, status: 'approved',
    },
    {
      title: 'Arduino Uno + Sensor Kit (Starter Pack)',
      description: 'Complete Arduino starter kit with Uno R3, breadboard, 40 jumper wires, DHT11 sensor.',
      category: 'electronics', subject: 'Electronics & IoT',
      tags: ['arduino', 'iot', 'sensors', 'microcontroller'],
      type: 'physical', condition: 'Excellent', exchangeMode: 'borrow',
      price: 0, deposit: 500, availability: 'available',
      location: 'EC Lab, Ground Floor', owner: yugandhar._id,
      images: [
        'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 5.0, reviewCount: 0, views: 0, status: 'approved',
    },
    {
      title: 'Machine Learning Lecture Notes – Unit 1–5',
      description: 'Comprehensive digital notes covering Supervised Learning, Neural Networks, SVM, Decision Trees.',
      category: 'notes', subject: 'Machine Learning',
      tags: ['machine learning', 'ML', 'notes', 'neural networks', 'SVM'],
      type: 'digital', exchangeMode: 'free',
      price: 0, availability: 'available',
      fileUrl: '/uploads/ml-notes-demo.pdf', fileType: 'PDF', fileSize: '4.2 MB',
      owner: yugandhar._id,
      images: [
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 5.0, reviewCount: 0, views: 0, status: 'approved',
    },
    {
      title: 'Digital Electronics Previous Year Question Papers (2019–2025)',
      description: 'Collection of 7 years of university question papers for Digital Electronics.',
      category: 'papers', subject: 'Electronics',
      tags: ['question papers', 'digital electronics', 'exam prep'],
      type: 'digital', exchangeMode: 'free', price: 0,
      availability: 'available', fileType: 'PDF', fileSize: '8.1 MB',
      owner: yugandhar._id,
      images: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 5.0, reviewCount: 0, views: 0, status: 'approved',
    },
    {
      title: 'Pending Review – IoT Lab Manual',
      description: 'Complete lab manual for IoT practicals. Awaiting admin review.',
      category: 'manuals', subject: 'IoT', tags: ['iot', 'manual'],
      type: 'digital', exchangeMode: 'free', price: 0,
      availability: 'available', owner: yugandhar._id,
      images: [
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'pending',
    },
  ]);
  console.log(`✓ Seeded ${resources.length} verified resources`);

  // Clean state: No fake reservations, transactions, reviews, notifications, or requirements
  console.log('✓ Clean state verified: 0 fake reservations, 0 fake transactions, 0 fake reports');

  console.log('\n🎉 Seeding complete!\n');
  console.log('Accounts:');
  console.log('  Primary Student : yugandhar23@lpu.in (Personal: yugandharchandu54@gmail.com, Phone: +91 9876543210) / Password@123');
  console.log('  Campus Admin    : admin@campus.edu (Phone: +91 9800000000) / AdminPass@123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
