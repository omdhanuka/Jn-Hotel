import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Banquet from '../models/Banquet';
import Table from '../models/Table';
import User, { IUser } from '../models/User';
import { sendBookingConfirmation } from '../utils/emailService';

interface AuthRequest extends Request {
  user?: IUser;
}

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, resourceId, checkIn, checkOut, guests, specialRequests, services } = req.body;
    
    let resource: any;
    let totalAmount = 0;

    // Validate resource exists and calculate amount
    switch (type) {
      case 'room':
        resource = await Room.findById(resourceId);
        if (!resource) {
          return res.status(404).json({ message: 'Room not found' });
        }
        if (!resource.isAvailable) {
          return res.status(400).json({ message: 'Room is not available' });
        }
        
        // Calculate nights and total amount
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = resource.price * nights;
        break;

      case 'banquet':
        resource = await Banquet.findById(resourceId);
        if (!resource) {
          return res.status(404).json({ message: 'Banquet hall not found' });
        }
        if (!resource.isAvailable) {
          return res.status(400).json({ message: 'Banquet hall is not available' });
        }
        totalAmount = resource.price;
        break;

      case 'table':
        resource = await Table.findById(resourceId);
        if (!resource) {
          return res.status(404).json({ message: 'Table not found' });
        }
        if (!resource.isAvailable) {
          return res.status(400).json({ message: 'Table is not available' });
        }
        totalAmount = 0; // Tables might be free or have minimum charge
        break;

      default:
        return res.status(400).json({ message: 'Invalid booking type' });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      type,
      resourceId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { $lte: new Date(checkIn) },
          checkOut: { $gt: new Date(checkIn) }
        },
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gte: new Date(checkOut) }
        },
        {
          checkIn: { $gte: new Date(checkIn) },
          checkOut: { $lte: new Date(checkOut) }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Resource is already booked for the selected dates' });
    }

    // Create booking
    const booking = new Booking({
      user: req.user!._id,
      type,
      resourceId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      totalAmount,
      specialRequests,
      services: services || []
    });

    await booking.save();

    // Add loyalty points (1 point per dollar spent)
    await User.findByIdAndUpdate(req.user!._id, {
      $inc: { loyaltyPoints: Math.floor(totalAmount) }
    });

    // Send booking confirmation email
    await sendBookingConfirmation(req.user!.email, {
      id: booking._id,
      type: booking.type,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalAmount: booking.totalAmount
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const filter: any = { user: req.user!._id };
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const bookings = await Booking.find(filter)
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow updates to confirmed bookings unless admin
    if (booking.status === 'confirmed' && req.user!.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot modify confirmed booking' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentMethodId } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    // Here you would integrate with Stripe or other payment processor
    // For now, we'll simulate successful payment
    booking.paymentStatus = 'paid';
    booking.paymentId = `pay_${Date.now()}`;
    booking.status = 'confirmed';
    await booking.save();

    res.json({ message: 'Payment processed successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
