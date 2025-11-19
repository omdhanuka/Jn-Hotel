import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import bookingRoutes from './routes/bookings';
import banquetRoutes from './routes/banquets';
import restaurantRoutes from './routes/restaurant';
import billRoutes from './routes/bills';
import reviewRoutes from './routes/reviews';
import Banquet from './models/Banquet';
import Booking from './models/Booking';
import Room from './models/Room';
import User from './models/User';
import { auth } from './middleware/auth';
import { adminAuth } from './middleware/adminAuth';
import { getAllReviews } from './controllers/adminController';
import path from 'path';

// Load environment variables first
dotenv.config();

// Log environment variables for debugging
console.log('🔍 Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/banquets', banquetRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reviews', reviewRoutes);

// Admin review listing (keeps admin panel endpoint working)
app.get('/api/admin/reviews', auth, adminAuth, getAllReviews);


// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
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
    console.log('MongoDB connected successfully');
    
    // Create sample data
    await createSampleBanquets();
    await createSampleBookings();
    
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/api`);
  });
};

startServer().catch(console.error);
