import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Room from '../models/Room';
import User, { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getReceptionStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's check-ins
    const todayCheckIns = await Booking.countDocuments({
      type: 'room',
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] }
    });

    // Today's check-outs
    const todayCheckOuts = await Booking.countDocuments({
      type: 'room',
      checkOut: { $gte: today, $lt: tomorrow },
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    });

    // Currently occupied rooms
    const occupiedRooms = await Booking.countDocuments({
      type: 'room',
      checkIn: { $lte: new Date() },
      checkOut: { $gt: new Date() },
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    });

    // Total available rooms
    const totalRooms = await Room.countDocuments({ status: 'active' });
    const availableRooms = totalRooms - occupiedRooms;

    // Pending check-ins (arrived but not checked in)
    const pendingCheckIns = await Booking.countDocuments({
      type: 'room',
      checkIn: { $lte: new Date() },
      checkOut: { $gt: new Date() },
      status: 'confirmed',
      isCheckedIn: { $ne: true }
    });

    res.json({
      todayCheckIns,
      todayCheckOuts,
      occupiedRooms,
      availableRooms,
      pendingCheckIns
    });
  } catch (error) {
    console.error('Reception stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTodaysBookings = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      type: 'room',
      $or: [
        { checkIn: { $gte: today, $lt: tomorrow } },
        { 
          checkIn: { $lt: today },
          checkOut: { $gte: today },
          status: 'confirmed'
        }
      ]
    })
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId')
      .sort({ checkIn: 1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get today bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkInGuest = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.type !== 'room') {
      return res.status(400).json({ message: 'Only room bookings can be checked in' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be checked in' });
    }

    if (booking.isCheckedIn) {
      return res.status(400).json({ message: 'Guest already checked in' });
    }

    // Update booking
    booking.isCheckedIn = true;
    await booking.save();

    // Update room status to occupied
    await Room.findByIdAndUpdate(booking.resourceId, {
      isBooked: true,
      status: 'active'
    });

    res.json({ message: 'Guest checked in successfully', booking });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkOutGuest = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.type !== 'room') {
      return res.status(400).json({ message: 'Only room bookings can be checked out' });
    }

    if (!booking.isCheckedIn) {
      return res.status(400).json({ message: 'Guest must be checked in first' });
    }

    if (booking.isCheckedOut) {
      return res.status(400).json({ message: 'Guest already checked out' });
    }

    // Update booking
    booking.isCheckedOut = true;
    booking.status = 'completed';
    await booking.save();

    // Update room status to cleaning/available
    await Room.findByIdAndUpdate(booking.resourceId, {
      isBooked: false,
      status: 'active'
    });

    res.json({ message: 'Guest checked out successfully', booking });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await Room.find({ status: { $ne: 'inactive' } })
      .sort({ roomNumber: 1 });

    // Get current bookings for each room
    const now = new Date();
    const roomsWithStatus = await Promise.all(
      rooms.map(async (room) => {
        const currentBooking = await Booking.findOne({
          type: 'room',
          resourceId: room._id,
          checkIn: { $lte: now },
          checkOut: { $gt: now },
          status: 'confirmed',
          isCheckedIn: true,
          isCheckedOut: { $ne: true }
        }).populate('user', 'firstName lastName');

        return {
          ...room.toObject(),
          currentBooking: currentBooking ? {
            guestName: currentBooking.user ? 
              `${(currentBooking.user as any).firstName} ${(currentBooking.user as any).lastName}` : 
              'Unknown',
            checkOut: currentBooking.checkOut
          } : null
        };
      })
    );

    res.json({ rooms: roomsWithStatus });
  } catch (error) {
    console.error('Get room status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRoomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    const validStatuses = ['active', 'cleaning', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid room status' });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room status updated successfully', room });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createWalkInBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { guestDetails, roomId, checkIn, checkOut, guests, totalAmount, advanceAmount, paymentMethod, specialRequests } = req.body;

    // Validate room availability
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Check for conflicts
    const conflictingBooking = await Booking.findOne({
      type: 'room',
      resourceId: roomId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gt: new Date(checkIn) } },
        { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gte: new Date(checkOut) } },
        { checkIn: { $gte: new Date(checkIn) }, checkOut: { $lte: new Date(checkOut) } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    // Find or create guest user
    let user = await User.findOne({ email: guestDetails.email });
    
    if (!user) {
      // Create temporary password for walk-in guest
      const tempPassword = Math.random().toString(36).slice(-8);
      
      user = new User({
        firstName: guestDetails.firstName,
        lastName: guestDetails.lastName,
        email: guestDetails.email,
        phone: guestDetails.phone,
        password: tempPassword,
        role: 'guest',
        isVerified: true
      });
      
      await user.save();
    }

    // Create booking
    const booking = new Booking({
      user: user._id,
      type: 'room',
      resourceId: roomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      totalAmount,
      status: 'confirmed',
      paymentStatus: advanceAmount >= totalAmount ? 'paid' : 'pending',
      specialRequests
    });

    await booking.save();

    res.status(201).json({ 
      message: 'Walk-in booking created successfully',
      booking,
      guestCreated: !user
    });
  } catch (error) {
    console.error('Walk-in booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
