import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Banquet from '../models/Banquet';
import User from '../models/User';

export const createSampleBookings = async () => {
  try {
    console.log('Creating sample bookings...');
    
    // Get sample users, rooms, and banquets
    const users = await User.find({ role: { $ne: 'admin' } }).limit(3);
    const rooms = await Room.find().limit(3);
    const banquets = await Banquet.find().limit(2);
    
    if (users.length === 0 || rooms.length === 0) {
      console.log('No users or rooms found for sample bookings');
      return;
    }

    const sampleBookings = [];
    const today = new Date();
    
    // Create room bookings
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
    
    // Create banquet bookings if banquets exist
    if (banquets.length > 0) {
      for (let i = 0; i < 2; i++) {
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + 10 + i * 7);
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
          status: ['pending', 'confirmed'][i % 2],
          paymentStatus: ['pending', 'paid'][i % 2],
          eventDetails: {
            eventType: ['Wedding', 'Birthday Party'][i % 2],
            fullName: `Guest ${i + 1}`,
            phone: `+1234567890`,
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
    
    // Clear existing sample bookings and insert new ones
    await Booking.deleteMany({ 
      user: { $in: users.map(u => u._id) }
    });
    
    await Booking.insertMany(sampleBookings);
    console.log(`Created ${sampleBookings.length} sample bookings`);
    
  } catch (error) {
    console.error('Error creating sample bookings:', error);
  }
};
