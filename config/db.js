const mongoose = require('mongoose');

const isWorker = (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers') || typeof process.env.ASSETS !== 'undefined';

// Connect to MongoDB database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_tracking';

    // In local Node.js, keep the existing persistent connection
    if (!isWorker) {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        return;
      }
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }

    // In Cloudflare Workers, each request requires a usable connection within its own execution context.
    // Force-reset any existing connection from a prior context without awaiting dead sockets.
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close({ force: true, skipCloseClient: true });
      } catch (e) {
        // ignore close error
      }
      delete mongoose.connection.$wasForceClosed;
      delete mongoose.connection._closeCalled;
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 1,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000
    });
    delete mongoose.connection.$wasForceClosed;
    delete mongoose.connection._closeCalled;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    if (!isWorker && require.main === module) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
