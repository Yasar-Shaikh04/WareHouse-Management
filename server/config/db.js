
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing from environment variables');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[MongoDB] Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`
    );

    return mongoose.connection;
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
