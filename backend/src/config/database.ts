import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management', {
      maxPoolSize: 50, // Increase connection pool size (default is 5)
      minPoolSize: 10, // Maintain minimum connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxIdleTimeMS: 30000, // Remove connection from pool after 30s of idle time
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool: Max ${50}, Min ${10}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
