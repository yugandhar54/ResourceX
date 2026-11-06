/**
 * ResourceX Backend – Main Server Entry Point
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 8080;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n✅ ResourceX API Server running on http://localhost:${PORT}/api`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   MongoDB     : ${process.env.MONGODB_URI}`);
    console.log(`   JWT Expires : ${process.env.JWT_EXPIRES_IN}\n`);
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
