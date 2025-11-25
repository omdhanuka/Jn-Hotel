import { Request, Response } from 'express';
import Booking from '../models/Booking';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getStaffBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, type, status, paymentStatus } = req.query;
    
    const filter: any = {};
    
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Staff get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBookingStatusByStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Staff can only update pending bookings
    if (booking.status !== 'pending' && status !== 'completed') {
      return res.status(400).json({ 
        message: 'Can only update pending bookings or mark confirmed bookings as completed' 
      });
    }

    booking.status = status;
    
    // Auto-update payment status when confirming
    if (status === 'confirmed' && booking.paymentStatus === 'pending') {
      booking.paymentStatus = 'paid';
    }
    
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email');

    res.json({ 
      message: 'Booking status updated successfully', 
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Staff update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
