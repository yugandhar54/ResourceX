/**
 * ResourceX – Database Seeder
 * Seeds realistic campus data matching the frontend DEMO_DATA structure.
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
  console.log('Connected to MongoDB. Seeding...\n');

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
  console.log('✓ Cleared all collections');

  /* ── Users ── */
  const defaultPw = await bcrypt.hash('Password@123', 12);
  const adminPw   = await bcrypt.hash('AdminPass@123', 12);

  const users = await User.insertMany([
    { firstName: 'Yugandhar', lastName: 'Chandu',  email: 'yugandhar23@lpu.in',        personalEmail: 'yugandharchandu54@gmail.com', rollNumber: '12318361', department: 'Computer Science & Engineering', role: 'student', password: defaultPw, rating: 5.0, interactions: 18 },
    { firstName: 'Arjun',     lastName: 'Sharma',  email: 'arjun.sharma@campus.edu',   personalEmail: 'arjun.sharma@gmail.com',      rollNumber: 'CS2021001', department: 'Computer Science & Engineering', role: 'student', password: defaultPw, rating: 4.8, interactions: 15 },
    { firstName: 'Priya',     lastName: 'Nair',    email: 'priya.nair@campus.edu',     personalEmail: 'priya.nair@gmail.com',        rollNumber: 'EC2021002', department: 'Electronics & Communication Engineering', role: 'student', password: defaultPw, rating: 4.9, interactions: 24 },
    { firstName: 'Keerthi',  lastName: 'Reddy',    email: 'keerthi.reddy@campus.edu',  rollNumber: 'CS2021003', department: 'Computer Science & Engineering',          role: 'student', password: defaultPw, rating: 4.5, interactions: 8  },
    { firstName: 'Rahul',    lastName: 'Menon',    email: 'rahul.menon@campus.edu',    rollNumber: 'CS2020001', department: 'Computer Science & Engineering',          role: 'student', password: defaultPw, rating: 4.7, interactions: 31 },
    { firstName: 'Anand',    lastName: 'Kumar',    email: 'anand.kumar@campus.edu',    rollNumber: 'FAC-CS-001',department: 'Computer Science & Engineering',          role: 'faculty', password: defaultPw, rating: 5.0, interactions: 12 },
    { firstName: 'Sneha',    lastName: 'Pillai',   email: 'sneha.pillai@campus.edu',   rollNumber: 'MA2022001', department: 'Mathematics',                            role: 'student', password: defaultPw, rating: 4.3, interactions: 5  },
    { firstName: 'Vikram',   lastName: 'Iyer',     email: 'vikram.iyer@campus.edu',    rollNumber: 'ME2021001', department: 'Mechanical Engineering',                 role: 'student', password: defaultPw, rating: 4.8, status: 'suspended', interactions: 3  },
    { firstName: 'Meera',    lastName: 'Varghese', email: 'meera.varghese@campus.edu', rollNumber: 'IT2021001', department: 'Information Technology',                 role: 'student', password: defaultPw, rating: 4.9, interactions: 9  },
    { firstName: 'Admin',    lastName: 'User',     email: 'admin@campus.edu',          rollNumber: 'ADM-001',   department: 'Administration',                        role: 'admin',   password: adminPw },
  ]);
  console.log(`✓ Seeded ${users.length} users`);

  const [yugandhar, arjun, priya, keerthi, rahul, anand, sneha, vikram, meera, admin] = users;

  /* ── Resources ── */
  const resources = await Resource.insertMany([
    {
      title: 'Data Structures & Algorithms – 3rd Edition',
      description: 'Comprehensive textbook by Cormen et al. (CLRS). Lightly used, all pages intact.',
      category: 'books', subject: 'Computer Science',
      tags: ['algorithms', 'data structures', 'CLRS', 'textbook'],
      type: 'physical', condition: 'Good', exchangeMode: 'borrow',
      price: 0, deposit: 100, availability: 'available',
      location: 'CS Block, Room 204', owner: arjun._id,
      images: [
        'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.7, reviewCount: 2, views: 87, status: 'approved',
    },
    {
      title: 'Arduino Uno + Sensor Kit (Starter Pack)',
      description: 'Complete Arduino starter kit with Uno R3, breadboard, 40 jumper wires, DHT11 sensor.',
      category: 'electronics', subject: 'Electronics & IoT',
      tags: ['arduino', 'iot', 'sensors', 'microcontroller'],
      type: 'physical', condition: 'Excellent', exchangeMode: 'borrow',
      price: 0, deposit: 500, availability: 'available',
      location: 'EC Lab, Ground Floor', owner: priya._id,
      images: [
        'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.9, reviewCount: 1, views: 134, status: 'approved',
    },
    {
      title: 'Operating Systems Concepts – Silberschatz',
      description: 'Dinosaur book, 10th edition. Some highlighting on chapters 1–4.',
      category: 'books', subject: 'Computer Science',
      tags: ['operating systems', 'OS', 'silberschatz'],
      type: 'physical', condition: 'Fair', exchangeMode: 'sell',
      price: 350, availability: 'available',
      location: 'Library Lobby', owner: keerthi._id,
      images: [
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.5, reviewCount: 0, views: 45, status: 'approved',
    },
    {
      title: 'Machine Learning Lecture Notes – Unit 1–5',
      description: 'Comprehensive digital notes covering Supervised Learning, Neural Networks, SVM, Decision Trees.',
      category: 'notes', subject: 'Machine Learning',
      tags: ['machine learning', 'ML', 'notes', 'neural networks', 'SVM'],
      type: 'digital', exchangeMode: 'free',
      price: 0, availability: 'available',
      fileUrl: '/uploads/ml-notes-demo.pdf', fileType: 'PDF', fileSize: '4.2 MB',
      owner: rahul._id,
      images: [
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.8, reviewCount: 1, views: 312, status: 'approved',
    },
    {
      title: 'Digital Electronics Previous Year Question Papers (2019–2025)',
      description: 'Collection of 7 years of university question papers for Digital Electronics.',
      category: 'papers', subject: 'Electronics',
      tags: ['question papers', 'digital electronics', 'exam prep'],
      type: 'digital', exchangeMode: 'free', price: 0,
      availability: 'available', fileType: 'PDF', fileSize: '8.1 MB',
      owner: priya._id,
      images: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.6, reviewCount: 0, views: 198, status: 'approved',
    },
    {
      title: 'Raspberry Pi 4 (4GB) + Case + Power Supply',
      description: 'Raspberry Pi 4 Model B 4GB RAM with official case, power adapter, and 32GB SD card.',
      category: 'electronics', subject: 'Computer Science & Engineering',
      tags: ['raspberry pi', 'embedded', 'linux', 'IoT'],
      type: 'physical', condition: 'Good', exchangeMode: 'borrow',
      price: 0, deposit: 1500, availability: 'borrowed',
      location: 'CSE Department Storeroom', owner: anand._id,
      images: [
        'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1562975079-50953a925695?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 5.0, reviewCount: 0, views: 76, status: 'approved',
    },
    {
      title: 'Engineering Mathematics Vol. I & II – R.K. Jain',
      description: 'Set of 2 textbooks for Engineering Mathematics. Covers Calculus, Linear Algebra, ODEs, and PDEs.',
      category: 'books', subject: 'Mathematics',
      tags: ['mathematics', 'engineering maths', 'calculus'],
      type: 'physical', condition: 'Good', exchangeMode: 'sell',
      price: 250, availability: 'available',
      location: 'Girls Hostel Block C', owner: sneha._id,
      images: [
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.3, reviewCount: 0, views: 52, status: 'approved',
    },
    {
      title: 'Vernier Calipers + Micrometer Screw Gauge Set',
      description: 'Precision measuring instruments for Mechanical Engineering lab practicals.',
      category: 'lab', subject: 'Mechanical Engineering',
      tags: ['vernier', 'micrometer', 'precision', 'metrology', 'ME lab'],
      type: 'physical', condition: 'Excellent', exchangeMode: 'borrow',
      price: 0, deposit: 300, availability: 'available',
      location: 'Mech Lab, Building B', owner: vikram._id,
      images: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.8, reviewCount: 0, views: 33, status: 'approved',
    },
    {
      title: 'Database Management Systems – Ramakrishnan & Gehrke',
      description: 'Classic DBMS textbook. Covers relational algebra, SQL, indexing, and transactions.',
      category: 'books', subject: 'Database Systems',
      tags: ['DBMS', 'database', 'SQL', 'textbook'],
      type: 'physical', condition: 'Excellent', exchangeMode: 'sell',
      price: 420, availability: 'available',
      location: 'CS Block, 3rd Floor', owner: meera._id,
      images: [
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.9, reviewCount: 0, views: 61, status: 'approved',
    },
    {
      title: 'Pending Review – IoT Lab Manual',
      description: 'Complete lab manual for IoT practicals. Awaiting admin review.',
      category: 'manuals', subject: 'IoT', tags: ['iot', 'manual'],
      type: 'digital', exchangeMode: 'free', price: 0,
      availability: 'available', owner: priya._id,
      images: [
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'pending',
    },
  ]);
  console.log(`✓ Seeded ${resources.length} resources`);

  const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = resources;

  /* ── Reviews ── */
  const reviews = await Review.insertMany([
    { resource: r1._id, author: keerthi._id, rating: 5, comment: 'Excellent book, perfect condition as described.' },
    { resource: r1._id, author: sneha._id,   rating: 4, comment: 'Great resource. Helped me a lot with exam prep.' },
    { resource: r2._id, author: arjun._id,   rating: 5, comment: 'Complete kit, all sensors working. Great for beginners!' },
    { resource: r4._id, author: sneha._id,   rating: 5, comment: 'Best ML notes I have seen. Covers everything with examples.' },
  ]);
  console.log(`✓ Seeded ${reviews.length} reviews`);

  /* ── Reservations ── */
  const reservations = await Reservation.insertMany([
    { resource: r2._id, requester: arjun._id, owner: priya._id,   startDate: new Date('2026-10-15'), returnDate: new Date('2026-10-29'), status: 'active',   type: 'borrow', notes: 'Need for IoT mini project.' },
    { resource: r1._id, requester: keerthi._id, owner: arjun._id, startDate: new Date('2026-10-18'), returnDate: new Date('2026-11-15'), status: 'pending',  type: 'borrow', notes: 'For semester exam prep.' },
    { resource: r8._id, requester: arjun._id, owner: vikram._id,  startDate: new Date('2026-10-20'), returnDate: new Date('2026-10-25'), status: 'approved', type: 'borrow', notes: 'Lab practical this week.' },
    { resource: r7._id, requester: rahul._id, owner: sneha._id,   startDate: new Date('2026-09-01'), returnDate: new Date('2026-09-30'), status: 'returned', type: 'borrow', notes: '' },
    { resource: r3._id, requester: meera._id, owner: keerthi._id, startDate: new Date('2026-10-17'), returnDate: new Date('2026-10-17'), status: 'rejected', type: 'sell',  notes: 'Interested in buying.' },
  ]);
  console.log(`✓ Seeded ${reservations.length} reservations`);

  /* ── Transactions ── */
  await Transaction.insertMany([
    { resource: r3._id, resourceTitle: 'OS – Silberschatz', initiator: arjun._id, counterpart: meera._id, counterpartName: 'Meera Varghese', type: 'sell', amount: 350, status: 'completed', date: new Date('2026-09-10T14:00:00Z') },
    { resource: r4._id, resourceTitle: 'ML Lecture Notes',  initiator: sneha._id, counterpart: rahul._id, counterpartName: 'Rahul Menon',    type: 'borrow', amount: 0, status: 'completed', date: new Date('2026-09-20T09:00:00Z') },
    { resource: r7._id, resourceTitle: 'Engineering Mathematics', initiator: arjun._id, counterpart: sneha._id, counterpartName: 'Sneha Pillai', type: 'buy', amount: 250, status: 'pending', date: new Date('2026-10-14T16:30:00Z') },
  ]);
  console.log('✓ Seeded 3 transactions');

  /* ── Notifications ── */
  await Notification.insertMany([
    { user: arjun._id, type: 'reservation', title: 'Borrow request received',  message: 'Keerthi Reddy wants to borrow your "Data Structures & Algorithms".', link: 'reservations.html', read: false },
    { user: arjun._id, type: 'match',       title: 'New resource match found',  message: 'A resource matching your requirement "IoT Components" was just listed.', link: 'matches.html', read: false },
    { user: arjun._id, type: 'transaction', title: 'Transaction update',        message: 'Your purchase of "Engineering Mathematics" is pending confirmation.', link: 'transactions.html', read: true },
    { user: arjun._id, type: 'system',      title: 'Profile verified',          message: 'Your campus email has been verified successfully.', link: 'profile.html', read: true },
  ]);
  console.log('✓ Seeded 4 notifications');

  /* ── Requirements ── */
  await Requirement.insertMany([
    { user: arjun._id, title: 'Arduino components for IoT project', description: 'I need Arduino Uno, sensors (DHT11, ultrasonic), and breadboard.', category: 'electronics', preferredType: 'physical', preferredModes: ['borrow'], budget: 0, requiredBy: new Date('2026-10-25'), tags: ['arduino', 'iot', 'sensors'], status: 'open' },
    { user: arjun._id, title: 'ML/AI textbook or notes', description: 'Looking for any good machine learning textbook or comprehensive notes.', category: 'books', preferredType: 'any', preferredModes: ['borrow', 'free'], budget: 200, requiredBy: new Date('2026-11-01'), tags: ['machine learning', 'AI'], status: 'open' },
  ]);
  console.log('✓ Seeded 2 requirements');

  console.log('\n🎉 Seeding complete!\n');
  console.log('Test accounts:');
  console.log('  Primary : yugandhar23@lpu.in (Reg: 12318361, Personal: yugandharchandu54@gmail.com) / Password@123');
  console.log('  Student : arjun.sharma@campus.edu  / Password@123');
  console.log('  Faculty : anand.kumar@campus.edu   / Password@123');
  console.log('  Admin   : admin@campus.edu         / AdminPass@123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
