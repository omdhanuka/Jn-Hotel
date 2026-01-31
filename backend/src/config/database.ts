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
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
      // Don't exit - allow auto-reconnection
    });
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.warn('⚠️  Server will continue but database features may not work');
    // Don't exit - allow server to run without DB
  }
};

export default connectDB;
