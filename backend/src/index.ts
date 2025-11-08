import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import banquetRoutes from './routes/banquets';
import bookingRoutes from './routes/bookings';
import restaurantRoutes from './routes/restaurant';
import billRoutes from './routes/bills';
import adminRoutes from './routes/admin';
import reviewRoutes from './routes/reviews';
import { auth } from './middleware/auth';
import { adminAuth } from './middleware/adminAuth';
import { getAllReviews } from './controllers/adminController';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/banquets', banquetRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// explicit admin reviews route
app.get('/api/admin/reviews', auth, adminAuth, getAllReviews);

console.log('✅ All routes registered successfully');

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Test review route specifically
app.get('/api/reviews/test', (req, res) => {
  res.json({ message: 'Review routes are loaded!', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  console.log(`Test the server at: http://localhost:${PORT}/api/test`);
  console.log(`Test review routes at: http://localhost:${PORT}/api/reviews/test`);
});
