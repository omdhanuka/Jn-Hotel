import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Banquet from '../models/Banquet';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

// Get all banquet halls with availability
export const getAllBanquetHalls = async (req: AuthRequest, res: Response) => {
  try {
    const halls = await Banquet.find({ status: 'active' }).sort({ name: 1 });
    
    // Get today's bookings for each hall
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hallsWithStatus = await Promise.all(
      halls.map(async (hall) => {
        const todayBooking = await Booking.findOne({
          type: 'banquet',
          resourceId: hall._id,
          checkIn: { $gte: today, $lt: tomorrow },
          status: { $in: ['confirmed', 'pending'] }
        }).populate('user', 'firstName lastName email');

        const upcomingBooking = await Booking.findOne({
          type: 'banquet',
          resourceId: hall._id,
          checkIn: { $gt: new Date() },
          status: { $in: ['confirmed', 'pending'] }
        })
          .sort({ checkIn: 1 })
          .populate('user', 'firstName lastName');

        return {
          ...hall.toObject(),
          bookedToday: !!todayBooking,
          todayBooking: todayBooking ? {
            customerName: `${(todayBooking.user as any)?.firstName || ''} ${(todayBooking.user as any)?.lastName || ''}`,
            eventType: todayBooking.eventDetails?.eventType,
            guests: todayBooking.guests
          } : null,
          upcomingEvent: upcomingBooking ? {
            date: upcomingBooking.checkIn,
            customerName: `${(upcomingBooking.user as any)?.firstName || ''} ${(upcomingBooking.user as any)?.lastName || ''}`,
            eventType: upcomingBooking.eventDetails?.eventType
          } : null
        };
      })
    );

    res.json({ halls: hallsWithStatus });
  } catch (error) {
    console.error('Get banquet halls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all banquet bookings with filters
export const getBanquetBookings = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      hallId,
      startDate,
      endDate,
      search
    } = req.query;

    const filter: any = { type: 'banquet' };

    if (status && status !== 'all') filter.status = status;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
    if (hallId) filter.resourceId = hallId;

    if (startDate || endDate) {
      filter.checkIn = {};
      if (startDate) filter.checkIn.$gte = new Date(startDate as string);
      if (endDate) filter.checkIn.$lte = new Date(endDate as string);
    }

    let bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId', 'name capacity')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ checkIn: -1 });

    // Apply search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      bookings = bookings.filter(booking => {
        const userName = `${(booking.user as any)?.firstName || ''} ${(booking.user as any)?.lastName || ''}`.toLowerCase();
        const bookingId = booking._id.toString().slice(-8).toLowerCase();
        const eventType = booking.eventDetails?.eventType?.toLowerCase() || '';
        
        return userName.includes(searchLower) ||
               bookingId.includes(searchLower) ||
               eventType.includes(searchLower);
      });
    }

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
    console.error('Get banquet bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single booking details
export const getBanquetBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId');

    if (!booking || booking.type !== 'banquet') {
      return res.status(404).json({ message: 'Banquet booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update banquet booking (approve/decline/update)
export const updateBanquetBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentStatus, notes, eventDetails, resourceId } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.type !== 'banquet') {
      return res.status(404).json({ message: 'Banquet booking not found' });
    }

    // Update fields
    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (notes) booking.specialRequests = notes;
    if (eventDetails) booking.eventDetails = { ...booking.eventDetails, ...eventDetails };
    if (resourceId) booking.resourceId = resourceId;

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email')
      .populate('resourceId', 'name');

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign/Change banquet hall
export const assignBanquetHall = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, hallId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.type !== 'banquet') {
      return res.status(404).json({ message: 'Banquet booking not found' });
    }

    // Check if hall exists
    const hall = await Banquet.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Check if hall is available
    const conflictingBooking = await Booking.findOne({
      type: 'banquet',
      resourceId: hallId,
      status: { $in: ['confirmed', 'pending'] },
      _id: { $ne: bookingId },
      $or: [
        { checkIn: { $lte: booking.checkIn }, checkOut: { $gt: booking.checkIn } },
        { checkIn: { $lt: booking.checkOut }, checkOut: { $gte: booking.checkOut } },
        { checkIn: { $gte: booking.checkIn }, checkOut: { $lte: booking.checkOut } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Hall is already booked for the selected time' });
    }

    booking.resourceId = hallId;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName')
      .populate('resourceId', 'name');

    res.json({
      message: 'Hall assigned successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Assign hall error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get banquet statistics
export const getBanquetStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalHalls = await Banquet.countDocuments({ status: 'active' });
    
    const todayBookings = await Booking.countDocuments({
      type: 'banquet',
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] }
    });

    const pendingApprovals = await Booking.countDocuments({
      type: 'banquet',
      status: 'pending'
    });

    const upcomingEvents = await Booking.countDocuments({
      type: 'banquet',
      checkIn: { $gt: new Date() },
      status: 'confirmed'
    });

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          type: 'banquet',
          paymentStatus: 'paid',
          createdAt: {
            $gte: new Date(today.getFullYear(), today.getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      totalHalls,
      todayBookings,
      pendingApprovals,
      upcomingEvents,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Get banquet stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get calendar view data
export const getBanquetCalendar = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    
    const targetDate = new Date(
      parseInt(year as string) || new Date().getFullYear(),
      parseInt(month as string) || new Date().getMonth(),
      1
    );
    
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

    const bookings = await Booking.find({
      type: 'banquet',
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { checkIn: { $gte: startOfMonth, $lte: endOfMonth } },
        { checkOut: { $gte: startOfMonth, $lte: endOfMonth } },
        { checkIn: { $lte: startOfMonth }, checkOut: { $gte: endOfMonth } }
      ]
    })
      .populate('resourceId', 'name')
      .populate('user', 'firstName lastName')
      .sort({ checkIn: 1 });

    const halls = await Banquet.find({ status: 'active' }).select('name');

    res.json({
      bookings: bookings.map(b => ({
        id: b._id,
        title: `${(b.user as any)?.firstName || ''} ${(b.user as any)?.lastName || ''} - ${b.eventDetails?.eventType || 'Event'}`,
        start: b.checkIn,
        end: b.checkOut,
        hall: (b.resourceId as any)?.name,
        hallId: b.resourceId,
        guests: b.guests,
        status: b.status,
        eventType: b.eventDetails?.eventType
      })),
      halls
    });
  } catch (error) {
    console.error('Get calendar data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
