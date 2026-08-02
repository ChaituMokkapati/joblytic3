import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB with timeout and graceful fallback
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/amb_saas_db';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500 // Quick timeout if local MongoDB service isn't running
    });
    isConnected = true;
    console.log(`🍃 MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.log(`⚠️ MongoDB Connection Info: Local MongoDB service not active (${error.message}). Operating in hybrid storage mode.`);
    return false;
  }
};

export const getDBStatus = () => {
  return isConnected && mongoose.connection.readyState === 1
    ? 'Connected (MongoDB)'
    : 'In-Memory Cache (MongoDB Disconnected)';
};

export const isMongoReady = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
