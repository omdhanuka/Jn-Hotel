import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import bookingRoutes from './routes/bookings';
import banquetRoutes from './routes/banquets';
import restaurantRoutes from './routes/restaurant';
import billRoutes from './routes/bills';
import reviewRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import receptionRoutes from './routes/reception';
import managerRoutes from './routes/manager';
import staffRoutes from './routes/staffRoutes';

// Import models for sample data
import Banquet from './models/Banquet';
import Booking from './models/Booking';
import Room from './models/Room';
import User from './models/User';

// Import middleware
import { auth } from './middleware/auth';
import { adminAuth } from './middleware/adminAuth';
import { getAllReviews } from './controllers/adminController';

// Load environment variables first
dotenv.config();

// Log environment variables for debugging
console.log('🔍 Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

const app = express();

// Rate Limiting - Prevent abuse and DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for auth endpoints
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for API calls
  message: 'API rate limit exceeded, please slow down.',
});

// Apply rate limiting (conditionally in production)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

// CORS Middleware - MUST be before rate limiting and routes
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes - Register in correct order
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/banquets', banquetRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/staff', staffRoutes);

// Admin review listing (alternate endpoint)
app.get('/api/admin/reviews', auth, adminAuth, getAllReviews);

// Log all registered routes for debugging
console.log('✅ Registered routes:');
console.log('  - /api/auth');
console.log('  - /api/rooms');
console.log('  - /api/banquets');
console.log('  - /api/restaurant');
console.log('  - /api/bookings');
console.log('  - /api/bills');
console.log('  - /api/reviews');
console.log('  - /api/admin');
console.log('  - /api/reception');
console.log('  - /api/manager');
console.log('  - /api/staff');

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Create sample banquets
const createSampleBanquets = async () => {
  try {
    const existingBanquets = await Banquet.countDocuments();
    if (existingBanquets === 0) {
      console.log('Creating sample banquets...');
      
      const sampleBanquets = [
        {
          banquetId: 'BH001',
          name: 'Emerald Grand Hall',
          type: 'wedding',
          description: 'Our largest and most luxurious wedding hall featuring crystal chandeliers and elegant décor.',
          capacity: 500,
          pricePerDay: 5000,
          pricePerHour: 800,
          minimumHours: 6,
          amenities: ['Stage/Podium', 'Dance Floor', 'Bridal Room', 'Kitchen Access'],
          facilities: {
            ac: true,
            projector: true,
            soundSystem: true,
            wifi: true,
            parking: true,
            catering: true,
            decoration: true,
            dj: true,
            photography: true,
            powerBackup: true
          },
          seatingArrangements: ['Round Table', 'Theatre Style', 'Banquet'],
          area: '3000 sq ft',
          floor: 2,
          location: 'Main Building - Second Floor',
          isAvailable: true,
          status: 'active',
          images: ['/api/placeholder/600/400', '/api/placeholder/600/401'],
          createdBy: 'System'
        },
        {
          banquetId: 'BH002',
          name: 'Sapphire Conference Hall',
          type: 'conference',
          description: 'Modern conference hall equipped with state-of-the-art audio-visual equipment.',
          capacity: 200,
          pricePerDay: 2500,
          pricePerHour: 400,
          minimumHours: 4,
          amenities: ['Projector Setup', 'Green Room', 'Storage Space'],
          facilities: {
            ac: true,
            projector: true,
            soundSystem: true,
            wifi: true,
            parking: true,
            catering: true,
            decoration: false,
            dj: false,
            photography: false,
            powerBackup: true
          },
          seatingArrangements: ['Theatre Style', 'Classroom', 'U-Shape'],
          area: '1500 sq ft',
          floor: 1,
          location: 'Business Center - Ground Floor',
          isAvailable: true,
          status: 'active',
          images: ['/api/placeholder/600/402'],
          createdBy: 'System'
        },
        {
          banquetId: 'BH003',
          name: 'Ruby Party Hall',
          type: 'party',
          description: 'Perfect for birthday parties, anniversaries, and social gatherings.',
          capacity: 150,
          pricePerDay: 2000,
          pricePerHour: 300,
          minimumHours: 4,
          amenities: ['Dance Floor', 'Bar Counter', 'Garden View'],
          facilities: {
            ac: true,
            projector: false,
            soundSystem: true,
            wifi: true,
            parking: true,
            catering: true,
            decoration: true,
            dj: true,
            photography: true,
            powerBackup: true
          },
          seatingArrangements: ['Cocktail', 'Round Table'],
          area: '1200 sq ft',
          floor: 1,
          location: 'West Wing - Ground Floor',
          isAvailable: true,
          status: 'active',
          images: ['/api/placeholder/600/403'],
          createdBy: 'System'
        }
      ];

      await Banquet.insertMany(sampleBanquets);
      console.log('Sample banquets created successfully!');
    }
  } catch (error) {
    console.error('Error creating sample banquets:', error);
  }
};

// Create sample bookings
const createSampleBookings = async () => {
  try {
    const existingBookings = await Booking.countDocuments();
    if (existingBookings === 0) {
      console.log('Creating sample bookings...');
      
      // Get sample users, rooms, and banquets
      const users = await User.find({ role: { $ne: 'admin' } }).limit(3);
      const rooms = await Room.find().limit(3);
      const banquets = await Banquet.find().limit(2);
      
      if (users.length === 0) {
        console.log('No users found, skipping sample bookings creation');
        return;
      }

      const sampleBookings = [];
      const today = new Date();
      
      // Create room bookings if rooms exist
      if (rooms.length > 0) {
        for (let i = 0; i < 3; i++) {
          const checkIn = new Date(today);
          checkIn.setDate(today.getDate() + i * 3);
          const checkOut = new Date(checkIn);
          checkOut.setDate(checkIn.getDate() + 2);
          
          sampleBookings.push({
            user: users[i % users.length]._id,
            type: 'room',
            resourceId: rooms[i % rooms.length]._id,
            checkIn: checkIn,
            checkOut: checkOut,
            guests: Math.floor(Math.random() * 4) + 1,
            totalAmount: 200 + (i * 100),
            status: ['pending', 'confirmed', 'completed'][i % 3],
            paymentStatus: ['pending', 'paid', 'paid'][i % 3]
          });
        }
      }
      
      // Create banquet bookings if banquets exist
      if (banquets.length > 0) {
        for (let i = 0; i < 3; i++) {
          const eventDate = new Date(today);
          eventDate.setDate(today.getDate() + 5 + i * 7);
          const startTime = new Date(eventDate);
          startTime.setHours(18, 0, 0, 0);
          const endTime = new Date(eventDate);
          endTime.setHours(23, 0, 0, 0);
          
          sampleBookings.push({
            user: users[i % users.length]._id,
            type: 'banquet',
            resourceId: banquets[i % banquets.length]._id,
            checkIn: startTime,
            checkOut: endTime,
            guests: 50 + (i * 25),
            totalAmount: 2000 + (i * 1000),
            status: ['pending', 'confirmed', 'completed'][i % 3],
            paymentStatus: ['pending', 'paid', 'paid'][i % 3],
            eventDetails: {
              eventType: ['Wedding', 'Birthday Party', 'Corporate Meeting'][i % 3],
              fullName: `Guest ${i + 1}`,
              phone: '+1234567890',
              cateringPreference: 'both',
              decorationTheme: 'premium',
              seatingArrangement: 'Round Table',
              parkingRequired: true,
              numberOfVehicles: 10,
              musicDjRequired: true,
              bookingType: 'daily',
              advanceAmount: 400 + (i * 200),
              paymentMethod: 'online'
            }
          });
        }
      }
      
      if (sampleBookings.length > 0) {
        await Booking.insertMany(sampleBookings);
        console.log(`Created ${sampleBookings.length} sample bookings`);
      } else {
        console.log('No sample data available for creating bookings');
      }
    }
  } catch (error) {
    console.error('Error creating sample bookings:', error);
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB connected successfully');
    
    // Create sample data
    await createSampleBanquets();
    await createSampleBookings();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('⚠️  Continuing without sample data...');
    // Don't exit - allow server to retry connection
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process - just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠️  Uncaught Exception:', error);
  // Don't exit the process - just log the error
});

// 404 handler - must be after all routes
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', error);
  
  // Handle CORS errors specifically
  if (error.message && error.message.includes('CORS')) {
    res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(error.status || 500).json({ 
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);

// Start server
const startServer = async () => {
  await initializeDatabase();

  const basePort = PORT;
  const maxAttempts = 10; // try basePort .. basePort+maxAttempts-1

  for (let i = 0; i < maxAttempts; i++) {
    const tryPort = basePort + i;

    try {
      const server = await new Promise<import('http').Server>((resolve, reject) => {
        const s = app.listen(tryPort)
          .once('listening', () => resolve(s))
          .once('error', (err: any) => reject(err));
      });

      console.log('');
      console.log('='.repeat(50));
      console.log(`🚀 Server running on port ${tryPort}`);
      console.log(`📍 API available at: http://localhost:${tryPort}/api`);
      console.log(`🏥 Health check: http://localhost:${tryPort}/api/health`);
      console.log(`🧪 Test route: http://localhost:${tryPort}/api/test`);
      console.log('='.repeat(50));
      console.log('');

      // update process.env.PORT to the actual port used
      process.env.PORT = String(tryPort);
      return;
    } catch (err: any) {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`⚠️  Port ${tryPort} is already in use. Trying next port...`);
        // try next port
        continue;
      } else {
        console.error('❌ Unable to start server due to unexpected error:', err);
        process.exit(1);
      }
    }
  }

  console.error(`❌ All ports ${basePort}..${basePort + maxAttempts - 1} are in use. Exiting.`);
  process.exit(1);
};

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
