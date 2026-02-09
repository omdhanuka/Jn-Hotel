import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Banquet from '../models/Banquet';
import Table from '../models/Table';
import User, { IUser } from '../models/User';
import Complaint from '../models/Complaint';
import { sendBookingConfirmation, sendBookingStatusUpdate, sendPaymentStatusUpdate, sendBanquetBookingConfirmation } from '../utils/emailService';

interface AuthRequest extends Request {
  user?: IUser;
}

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, resourceId, checkIn, checkOut, guests, specialRequests, services, eventDetails } = req.body;
    
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
        
        // Calculate duration and total amount for banquet
        const eventStart = new Date(checkIn);
        const eventEnd = new Date(checkOut);
        const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
        
        // Use total amount from frontend if provided, otherwise calculate
        if (req.body.totalAmount && req.body.totalAmount > 0) {
          totalAmount = req.body.totalAmount;
        } else {
          // Fallback calculation
          if (eventDetails?.bookingType === 'daily') {
            totalAmount = resource.pricePerDay;
          } else {
            const hours = Math.max(duration, resource.minimumHours || 4);
            totalAmount = resource.pricePerHour * hours;
          }
        }
        break;

      case 'table':
        resource = await Table.findById(resourceId);
        if (!resource) {
          return res.status(404).json({ message: 'Table not found' });
        }
        if (!resource.isAvailable) {
          return res.status(400).json({ message: 'Table is not available' });
        }
        totalAmount = req.body.totalAmount || 0;
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
      const conflictStatus = conflictingBooking.status === 'confirmed' ? 'confirmed' : 'pending';
      return res.status(400).json({ 
        message: `${type} is already booked for the selected dates (${conflictStatus} booking)`,
        conflictingBooking: {
          id: conflictingBooking._id,
          checkIn: conflictingBooking.checkIn,
          checkOut: conflictingBooking.checkOut,
          status: conflictingBooking.status
        }
      });
    }

    // Create booking data
    const bookingData: any = {
      user: req.user!._id,
      type,
      resourceId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: guests || 1,
      totalAmount,
      specialRequests: specialRequests || '',
      services: services || []
    };

    // Add event details for banquet bookings
    if (type === 'banquet' && eventDetails) {
      bookingData.eventDetails = eventDetails;
    }

    // Create booking
    const booking = new Booking(bookingData);
    await booking.save();

    // Add loyalty points (1 point per rupee spent)
    if (totalAmount > 0) {
      await User.findByIdAndUpdate(req.user!._id, {
        $inc: { loyaltyPoints: Math.floor(totalAmount) }
      });
    }

    // Send appropriate confirmation email based on booking type
    try {
      if (type === 'banquet') {
        await sendBanquetBookingConfirmation(req.user!.email, booking, {
          firstName: req.user!.firstName,
          lastName: req.user!.lastName
        });
      } else {
        await sendBookingConfirmation(req.user!.email, booking, {
          firstName: req.user!.firstName,
          lastName: req.user!.lastName
        });
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json(booking);
  } catch (error: any) {
    console.error('Booking creation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? (error?.message || 'Unknown error') : 'Internal server error'
    });
  }
};

export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, page = '1', limit = '10' } = req.query;
    
    // Validate query parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ message: 'Invalid page number' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: 'Invalid limit. Must be between 1 and 100' });
    }
    
    const filter: any = { user: req.user!._id };
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    console.log('📋 Fetching bookings for user:', {
      userId: req.user!._id.toString(),
      userRole: req.user!.role,
      filter,
      page: pageNum,
      limit: limitNum
    });

    // Auto-update confirmed bookings to completed if checkout date has passed
    const now = new Date();
    await Booking.updateMany(
      {
        user: req.user!._id,
        status: 'confirmed',
        checkOut: { $lt: now }
      },
      {
        $set: { status: 'completed' }
      }
    );

    const bookings = await Booking.find(filter)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    console.log(`✅ Found ${bookings.length} bookings out of ${total} total`);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(id).populate('user', 'firstName lastName email phone');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get the booking user ID (handle both populated and unpopulated)
    let bookingUserId: string;
    if (booking.user && typeof booking.user === 'object' && '_id' in booking.user) {
      bookingUserId = (booking.user as any)._id.toString();
    } else {
      bookingUserId = (booking.user as any).toString();
    }

    // Check access permissions
    const currentUserId = req.user!._id.toString();
    const isOwner = bookingUserId === currentUserId;
    const isAdmin = req.user!.role === 'admin';
    const isManager = req.user!.role === 'manager';
    const isStaffWithPermission = (req.user!.role === 'staff' || req.user!.role === 'reception') && 
      (req.user!.permissions?.viewBookings || req.user!.permissions?.manageBanquets || req.user!.permissions?.viewBanquets);
    
    // Log permission check for debugging
    console.log('🔐 Booking access check:', {
      bookingId: id,
      bookingUserId,
      currentUserId,
      userRole: req.user!.role,
      isOwner,
      isAdmin,
      isManager,
      isStaffWithPermission
    });
    
    // Allow access if user is owner, admin, manager, or staff with booking view permissions
    if (!isOwner && !isAdmin && !isManager && !isStaffWithPermission) {
      console.log('❌ Access denied for user:', currentUserId);
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to view this booking.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking by ID error:', error);
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
    
    // Automatically update payment status based on current status
    if (booking.paymentStatus === 'paid') {
      // If already paid, mark for refund
      booking.paymentStatus = 'refunded';
    } else if (booking.paymentStatus === 'pending') {
      // If payment is pending, cancel it
      booking.paymentStatus = 'cancelled';
    }
    // If already refunded, cancelled, or failed, keep the same status
    
    await booking.save();

    // Send notification email about cancellation (optional)
    // await sendCancellationEmail(booking.user.email, booking);

    res.json({ 
      message: 'Booking cancelled successfully', 
      booking,
      paymentAction: booking.paymentStatus === 'refunded' ? 'Refund will be processed' : 'Payment cancelled'
    });
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

export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentStatus } = req.body;
    
    // Only admin can update payment status
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const validStatuses = ['pending', 'paid', 'refunded', 'cancelled', 'failed'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).populate('user', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // If payment is confirmed, update booking status to confirmed
    if (paymentStatus === 'paid' && booking.status === 'pending') {
      booking.status = 'confirmed';
      await booking.save();
    }

    // Send payment status update email
    try {
      const user = booking.user as any;
      await sendPaymentStatusUpdate(
        user.email,
        `${user.firstName} ${user.lastName}`,
        booking,
        paymentStatus
      );
    } catch (emailError) {
      console.error('Failed to send payment status email:', emailError);
    }

    res.json({ message: 'Payment status updated successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelBookingByAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can cancel any booking
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    
    // Update payment status based on current status
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    } else if (booking.paymentStatus === 'pending') {
      booking.paymentStatus = 'cancelled';
    }
    
    await booking.save();

    res.json({ 
      message: 'Booking cancelled successfully by admin', 
      booking,
      paymentAction: booking.paymentStatus === 'refunded' ? 'Refund will be processed' : 'Payment cancelled'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBookingByAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can update any booking
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { checkIn, checkOut, guests, specialRequests } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot modify cancelled or completed bookings' });
    }

    // Validate dates
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Update booking
    booking.checkIn = new Date(checkIn);
    booking.checkOut = new Date(checkOut);
    booking.guests = guests;
    if (specialRequests !== undefined) {
      booking.specialRequests = specialRequests;
    }
    
    await booking.save();

    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBookingsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can view all bookings
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Auto-update confirmed bookings to completed if checkout date has passed
    const now = new Date();
    await Booking.updateMany(
      {
        status: 'confirmed',
        checkOut: { $lt: now }
      },
      {
        $set: { status: 'completed' }
      }
    );

    const { page = 1, limit = 20, status, type, paymentStatus } = req.query;
    
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    console.log('Admin booking filter:', filter); // Debug log

    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email')
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

export const createBookingByAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can create bookings manually
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { email, firstName, lastName, phone, type, checkIn, checkOut, guests, roomNumber, specialRequests } = req.body;

    // Validate required fields
    if (!email || !type || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Email, type, check-in, and check-out dates are required' });
    }

    // Find user by email or create new user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Validate required fields for new user
      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required for new users' });
      }

      // Create new user with a temporary password
      const bcrypt = require('bcryptjs');
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'; // Generate random password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || '',
        role: 'guest',
        isActive: true
      });

      await user.save();
      
      // TODO: Send email with temporary password (optional)
      console.log(`New user created: ${email} with temporary password: ${tempPassword}`);
    }

    let resourceId: any = null;
    let totalAmount = 0;

    // Handle different booking types
    if (type === 'room') {
      // If room number is specified, find that specific room
      if (roomNumber) {
        const room = await Room.findOne({ roomNumber: roomNumber });
        if (!room) {
          return res.status(404).json({ message: `Room ${roomNumber} not found` });
        }
        
        // Check if room is available for the dates
        const conflictingBooking = await Booking.findOne({
          resourceId: room._id,
          type: 'room',
          status: { $in: ['pending', 'confirmed'] },
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
          return res.status(400).json({ 
            message: `Room ${roomNumber} is already booked for the selected dates` 
          });
        }

        resourceId = room._id;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = room.price * nights;
      } else {
        // Find any available room
        const availableRoom = await Room.findOne({ isAvailable: true });
        if (!availableRoom) {
          return res.status(400).json({ message: 'No available rooms found' });
        }
        
        resourceId = availableRoom._id;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = availableRoom.price * nights;
      }
    } else if (type === 'banquet') {
      // For banquet, admin must specify which hall (for now, just get the first available)
      const banquet = await Banquet.findOne({ isAvailable: true });
      if (!banquet) {
        return res.status(400).json({ message: 'No available banquet halls found' });
      }
      
      resourceId = banquet._id;
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const hours = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60));
      totalAmount = banquet.pricePerHour * hours;
    } else if (type === 'table') {
      // For table booking
      const table = await Table.findOne({ isAvailable: true });
      if (!table) {
        return res.status(400).json({ message: 'No available tables found' });
      }
      
      resourceId = table._id;
      totalAmount = 0; // Table bookings might be free or have different pricing
    }

    // Create booking
    const booking = new Booking({
      user: user._id,
      type,
      resourceId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: guests || 1,
      totalAmount,
      specialRequests: specialRequests || '',
      status: 'confirmed', // Admin-created bookings are automatically confirmed
      paymentStatus: 'pending'
    });

    await booking.save();

    // Populate user data for response
    await booking.populate('user', 'firstName lastName email');

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};

export const getBookingsForChart = async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can view booking chart
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { startDate, endDate, type } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Build filter query - more inclusive date filtering
    const filter: any = {
      status: { $ne: 'cancelled' }, // Exclude cancelled bookings
      $or: [
        // Booking starts within the month
        {
          checkIn: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) }
        },
        // Booking ends within the month
        {
          checkOut: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) }
        },
        // Booking spans the entire month
        {
          checkIn: { $lte: new Date(startDate as string) },
          checkOut: { $gte: new Date(endDate as string) }
        },
        // Booking overlaps with month in any way
        {
          checkIn: { $lte: new Date(endDate as string) },
          checkOut: { $gte: new Date(startDate as string) }
        }
      ]
    };

    // Add type filter if specified
    if (type && type !== 'all') {
      filter.type = type;
    }

    console.log('Chart filter:', JSON.stringify(filter, null, 2)); // Debug log
    console.log('Date range:', startDate, 'to', endDate); // Debug log

    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName')
      .sort({ checkIn: 1 });

    console.log('Found bookings:', bookings.length, 'bookings'); // Debug log
    
    // Log first few bookings for debugging
    if (bookings.length > 0) {
      console.log('Sample bookings:', bookings.slice(0, 3).map(b => ({
        id: b._id,
        type: b.type,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        resourceId: b.resourceId
      })));
    }

    const chartData = [];

    for (const booking of bookings) {
      const user = booking.user as any;
      let resourceData = null;

      try {
        if (booking.type === 'room') {
          resourceData = await Room.findById(booking.resourceId);
          console.log('Room resource:', resourceData?.roomNumber, resourceData?.type); // Debug log
          
          chartData.push({
            _id: booking._id,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            roomNumber: resourceData?.roomNumber || 'N/A',
            roomType: resourceData?.type || 'Unknown',
            guestName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Guest',
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            bookingType: 'room' as const
          });
        } else if (booking.type === 'banquet') {
          resourceData = await Banquet.findById(booking.resourceId);
          console.log('Banquet resource:', resourceData?.name, resourceData?.type); // Debug log
          
          chartData.push({
            _id: booking._id,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            banquetName: resourceData?.name || 'N/A',
            banquetType: resourceData?.type || 'Unknown',
            guestName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Guest',
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            bookingType: 'banquet' as const,
            eventType: (booking as any).eventDetails?.eventType || undefined
          });
        } else {
          // Handle other booking types
          chartData.push({
            _id: booking._id,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            roomNumber: 'Other',
            roomType: booking.type,
            guestName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Guest',
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            bookingType: booking.type as any
          });
        }
      } catch (error) {
        console.error('Error fetching resource for booking:', booking._id, error);
        // Add booking with N/A resource info if resource fetch fails
        const bookingData: any = {
          _id: booking._id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guestName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Guest',
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          bookingType: booking.type as any
        };

        if (booking.type === 'room') {
          bookingData.roomNumber = 'N/A';
          bookingData.roomType = 'Unknown';
        } else if (booking.type === 'banquet') {
          bookingData.banquetName = 'N/A';
          bookingData.banquetType = 'Unknown';
          bookingData.eventType = (booking as any).eventDetails?.eventType || undefined;
        }

        chartData.push(bookingData);
      }
    }

    console.log('Final chart data:', chartData.length, 'items'); // Debug log
    res.json({ bookings: chartData });
  } catch (error) {
    console.error('Error in getBookingsForChart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookingStats = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Getting booking stats...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Get booking stats for the last 30 days
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type"
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    console.log('Raw booking stats:', bookingStats);

    // Format data for chart
    const chartData = [];
    const dateMap = new Map();

    // Initialize all dates with zero values
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dateMap.set(dateStr, {
        date: dateStr,
        room: 0,
        banquet: 0,
        total: 0
      });
    }

    // Fill in actual booking data
    bookingStats.forEach(stat => {
      const dateStr = stat._id.date;
      if (dateMap.has(dateStr)) {
        const entry = dateMap.get(dateStr);
        entry[stat._id.type] = stat.count;
        entry.total += stat.count;
      }
    });

    // Convert map to array
    const finalChartData = Array.from(dateMap.values());

    // Get total stats
    const [totalBookings, roomBookings, banquetBookings, todayBookings] = await Promise.all([
      Booking.countDocuments({ status: { $ne: 'cancelled' } }),
      Booking.countDocuments({ type: 'room', status: { $ne: 'cancelled' } }),
      Booking.countDocuments({ type: 'banquet', status: { $ne: 'cancelled' } }),
      Booking.countDocuments({ 
        createdAt: { $gte: today },
        status: { $ne: 'cancelled' }
      })
    ]);

    console.log('Final stats:', {
      chartDataLength: finalChartData.length,
      totalBookings,
      roomBookings,
      banquetBookings,
      todayBookings
    });

    res.json({
      chartData: finalChartData,
      totalBookings,
      roomBookings,
      banquetBookings,
      todayBookings
    });
  } catch (error) {
    console.error('Booking stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    // Only admin can update booking status
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldStatus = booking.status;

    // If confirming a booking, check for conflicts with other confirmed bookings
    if (status === 'confirmed' && booking.status !== 'confirmed') {
      const conflictingBooking = await Booking.findOne({
        _id: { $ne: booking._id }, // Exclude current booking
        type: booking.type,
        resourceId: booking.resourceId,
        status: 'confirmed',
        $or: [
          {
            checkIn: { $lte: booking.checkIn },
            checkOut: { $gt: booking.checkIn }
          },
          {
            checkIn: { $lt: booking.checkOut },
            checkOut: { $gte: booking.checkOut }
          },
          {
            checkIn: { $gte: booking.checkIn },
            checkOut: { $lte: booking.checkOut }
          }
        ]
      });

      if (conflictingBooking) {
        return res.status(400).json({ 
          message: 'Cannot confirm booking - conflicts with another confirmed booking',
          conflictingBooking: {
            id: conflictingBooking._id,
            checkIn: conflictingBooking.checkIn,
            checkOut: conflictingBooking.checkOut
          }
        });
      }
    }

    booking.status = status;
    
    // Auto-update payment status when confirming
    if (status === 'confirmed' && booking.paymentStatus === 'pending') {
      booking.paymentStatus = 'paid';
    }
    
    await booking.save();

    // Send booking status update email
    try {
      const user = booking.user as any;
      await sendBookingStatusUpdate(
        user.email,
        `${user.firstName} ${user.lastName}`,
        booking,
        oldStatus,
        status
      );
    } catch (emailError) {
      console.error('Failed to send booking status email:', emailError);
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email');

    res.json({ message: 'Booking status updated successfully', booking: populatedBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create complaint for booking
// @route   POST /api/bookings/:id/complaint
// @access  Private
export const createBookingComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { category, priority, title, description, roomNumber } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user owns the booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create complaint for this booking' });
    }

    // Check if booking is within the valid complaint period (check-in to check-out)
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);

    if (now < checkInDate) {
      return res.status(400).json({ message: 'Cannot create complaint before check-in date' });
    }

    if (now > checkOutDate) {
      return res.status(400).json({ message: 'Cannot create complaint after check-out date' });
    }

    // Generate unique complaint ID
    const complaintCount = await Complaint.countDocuments();
    const complaintId = `CMP${String(complaintCount + 1).padStart(6, '0')}`;

    // Create the complaint
    const complaint = new Complaint({
      complaintId,
      user: req.user._id,
      booking: booking._id,
      category,
      priority: priority || 'medium',
      status: 'pending',
      title,
      description,
      roomNumber,
      timeline: [{
        timestamp: new Date(),
        action: 'Complaint created',
        performedBy: req.user._id
      }]
    });

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('user', 'firstName lastName email')
      .populate('booking');

    res.status(201).json({ 
      message: 'Complaint created successfully', 
      complaint: populatedComplaint 
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

