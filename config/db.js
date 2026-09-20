const mongoose = require('mongoose');

// Connect to MongoDB database
const connectDB = async () => {
  try {
    // If already connected, reuse connection
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return;
    }
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_tracking';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1); // Stop app if database cannot connect
  }
};

module.exports = connectDB;
