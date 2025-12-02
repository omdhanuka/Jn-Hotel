import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Room from '../models/Room';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getCheckinCheckoutStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayArrivals = await Booking.countDocuments({
      type: 'room',
      checkIn: { $gte: today, $lt: tomorrow },
      status: 'confirmed',
      isCheckedIn: { $ne: true }
    });

    const todayDepartures = await Booking.countDocuments({
      type: 'room',
      checkOut: { $gte: today, $lt: tomorrow },
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    });

    const currentGuests = await Booking.countDocuments({
      type: 'room',
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    });

    const pendingCheckouts = await Booking.countDocuments({
      type: 'room',
      checkOut: { $lt: tomorrow },
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    });

    res.json({
      todayArrivals,
      todayDepartures,
      currentGuests,
      pendingCheckouts
    });
  } catch (error) {
    console.error('Get checkin-checkout stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const recentCheckins = await Booking.find({
      type: 'room',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    })
      .populate('user', 'firstName lastName email')
      .populate('resourceId', 'roomNumber')
      .sort({ updatedAt: -1 })
      .limit(10);

    const recentCheckouts = await Booking.find({
      type: 'room',
      isCheckedOut: true
    })
      .populate('user', 'firstName lastName email')
      .populate('resourceId', 'roomNumber')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({
      recentCheckins,
      recentCheckouts
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTodayArrivals = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const arrivals = await Booking.find({
      type: 'room',
      checkIn: { $gte: today, $lt: tomorrow },
      status: 'confirmed'
    })
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId', 'roomNumber type')
      .sort({ checkIn: 1 });

    res.json({ arrivals });
  } catch (error) {
    console.error('Get today arrivals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTodayDepartures = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const departures = await Booking.find({
      type: 'room',
      checkOut: { $gte: today, $lt: tomorrow },
      status: 'confirmed',
      isCheckedIn: true
    })
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId', 'roomNumber type')
      .sort({ checkOut: 1 });

    res.json({ departures });
  } catch (error) {
    console.error('Get today departures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const performCheckin = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('resourceId', 'roomNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.type !== 'room') {
      return res.status(400).json({ message: 'Only room bookings can be checked in' });
    }

    if (booking.isCheckedIn) {
      return res.status(400).json({ message: 'Guest already checked in' });
    }

    booking.isCheckedIn = true;
    booking.status = 'confirmed';
    await booking.save();

    // Update room status
    await Room.findByIdAndUpdate(booking.resourceId, { isBooked: true });

    res.json({ 
      message: 'Check-in successful',
      booking 
    });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const performCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('resourceId', 'roomNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.type !== 'room') {
      return res.status(400).json({ message: 'Only room bookings can be checked out' });
    }

    if (!booking.isCheckedIn) {
      return res.status(400).json({ message: 'Guest not checked in yet' });
    }

    if (booking.isCheckedOut) {
      return res.status(400).json({ message: 'Guest already checked out' });
    }

    booking.isCheckedOut = true;
    booking.status = 'completed';
    await booking.save();

    // Update room status to cleaning
    await Room.findByIdAndUpdate(booking.resourceId, { 
      isBooked: false,
      status: 'cleaning'
    });

    res.json({ 
      message: 'Check-out successful',
      booking 
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({ bookings: [] });
    }

    const searchRegex = new RegExp(query as string, 'i');

    // Search by guest name in the populated user field
    const bookings = await Booking.find({
      type: 'room',
      status: { $in: ['confirmed', 'pending'] }
    })
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId', 'roomNumber type')
      .then(bookings => bookings.filter(b => {
        const user = b.user as any;
        if (!user) return false;
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email?.toLowerCase() || '';
        const phone = user.phone || '';
        const queryLower = (query as string).toLowerCase();
        
        return fullName.includes(queryLower) || 
               email.includes(queryLower) || 
               phone.includes(queryLower);
      }))
      .then(bookings => bookings.slice(0, 10));

    res.json({ bookings });
  } catch (error) {
    console.error('Search bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
