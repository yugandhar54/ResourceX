'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');

async function clearUsers() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('No MONGODB_URI found.');
      return;
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const countBefore = await User.countDocuments();
    console.log(`Current users in database: ${countBefore}`);
    const result = await User.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} users from MongoDB.`);
  } catch (err) {
    console.error('Error clearing users from MongoDB:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

clearUsers();

