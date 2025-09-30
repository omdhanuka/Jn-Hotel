import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import banquetRoutes from './routes/banquets';
import restaurantRoutes from './routes/restaurant';
import foodRoutes from './routes/food';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/banquets', banquetRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hotel Management API is running' });
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_restaurant', (tableId) => {
    socket.join(`table_${tableId}`);
    console.log(`User ${socket.id} joined table ${tableId}`);
  });
  
  socket.on('order_update', (data) => {
    io.to(`table_${data.tableId}`).emit('order_status', data);
    console.log('Order update sent to table:', data.tableId);
  });

  socket.on('booking_update', (data) => {
    io.emit('booking_status', data);
    console.log('Booking update broadcast:', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});
