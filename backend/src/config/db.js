const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[db] MONGO_URI is not set. Set it in your environment/.env file.');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    // Do not crash-loop the whole process in a way that hides the health endpoint.
    // Render restarts on crash, but we still want a clear log line for debugging.
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB runtime error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
}

module.exports = connectDB;
