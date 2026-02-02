const mongoose = require('mongoose');
require('dotenv').config();

const bookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

const roomSchema = new mongoose.Schema({}, { strict: false });
const Room = mongoose.model('Room', roomSchema, 'rooms');

async function checkRoom102Bookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel');
    console.log('✓ Connected to MongoDB');

    // Find Room 102
    const room102 = await Room.findOne({ roomNumber: '102' });
    if (!room102) {
      console.log('❌ Room 102 not found in database');
      process.exit(0);
    }
    console.log('\n✓ Room 102 found:', room102._id);

    // Find all bookings for Room 102
    const bookings = await Booking.find({ 
      resourceId: room102._id,
      type: 'room'
    }).lean();

    console.log(`\n📊 Total bookings for Room 102: ${bookings.length}\n`);

    if (bookings.length === 0) {
      console.log('No bookings found for Room 102');
    } else {
      bookings.forEach((booking, index) => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        console.log(`\n--- Booking ${index + 1} ---`);
        console.log('ID:', booking._id);
        console.log('Check-In:', checkIn.toISOString(), `(${checkIn.toLocaleDateString()})`);
        console.log('Check-Out:', checkOut.toISOString(), `(${checkOut.toLocaleDateString()})`);
        console.log('Duration:', duration, 'days');
        console.log('Status:', booking.status);
        console.log('Guest:', booking.guestName || 'N/A');
        
        if (duration > 30) {
          console.log('⚠️  WARNING: This booking is longer than 30 days!');
        }
      });
    }

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRoom102Bookings();
