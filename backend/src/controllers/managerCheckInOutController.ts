import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Room from '../models/Room';
import User, { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

// CHECK-IN APIS

export const searchBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchStr = query as string;
    let bookings: any[] = [];

    // Search by user details (phone, name)
    const users = await User.find({
      $or: [
        { firstName: { $regex: searchStr, $options: 'i' } },
        { lastName: { $regex: searchStr, $options: 'i' } },
        { phone: { $regex: searchStr, $options: 'i' } },
        { email: { $regex: searchStr, $options: 'i' } }
      ]
    }).distinct('_id');

    if (users.length > 0) {
      bookings = await Booking.find({
        type: 'room',
        user: { $in: users },
        status: { $in: ['confirmed', 'pending'] },
        isCheckedIn: { $ne: true }
      })
        .populate('user', 'firstName lastName email phone')
        .populate('resourceId')
        .limit(10)
        .sort({ checkIn: 1 });
    }

    // If no results yet, try searching by booking ID if it looks like an ObjectId
    if (bookings.length === 0 && /^[0-9a-fA-F]{24}$/.test(searchStr)) {
      try {
        const booking = await Booking.findById(searchStr)
          .populate('user', 'firstName lastName email phone')
          .populate('resourceId');
        
        if (booking && booking.type === 'room' && 
            ['confirmed', 'pending'].includes(booking.status) && 
            !booking.isCheckedIn) {
          bookings = [booking];
        }
      } catch (err) {
        // Invalid ObjectId, ignore
      }
    }

    res.json({ bookings });
  } catch (error) {
    console.error('Search bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAvailableRooms = async (req: AuthRequest, res: Response) => {
  try {
    const { type, checkIn, checkOut } = req.query;
    
    const filter: any = {
      status: 'active',
      isBooked: false
    };
    
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Find rooms not booked during the requested period
    if (checkIn && checkOut) {
      const bookedRoomIds = await Booking.find({
        type: 'room',
        status: { $in: ['confirmed', 'pending'] },
        $or: [
          {
            checkIn: { $lte: new Date(checkIn as string) },
            checkOut: { $gt: new Date(checkIn as string) }
          },
          {
            checkIn: { $lt: new Date(checkOut as string) },
            checkOut: { $gte: new Date(checkOut as string) }
          }
        ]
      }).distinct('resourceId');

      filter._id = { $nin: bookedRoomIds };
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, roomId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isBooked) {
      return res.status(400).json({ message: 'Room is already occupied' });
    }

    // Assign room to booking
    booking.resourceId = room._id;
    await booking.save();

    res.json({ 
      message: 'Room assigned successfully',
      booking: await Booking.findById(bookingId).populate('resourceId')
    });
  } catch (error) {
    console.error('Assign room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeCheckIn = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      bookingId, 
      numberOfGuests, 
      idProof, 
      notes, 
      paymentStatus, 
      paymentMode 
    } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('resourceId')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.resourceId) {
      return res.status(400).json({ message: 'Room not assigned yet' });
    }

    if (booking.isCheckedIn) {
      return res.status(400).json({ message: 'Guest already checked in' });
    }

    // Update booking
    booking.guests = numberOfGuests || booking.guests;
    booking.isCheckedIn = true;
    booking.paymentStatus = paymentStatus || booking.paymentStatus;
    if (notes) {
      booking.specialRequests = booking.specialRequests 
        ? `${booking.specialRequests}\n\nCheck-in notes: ${notes}`
        : `Check-in notes: ${notes}`;
    }

    await booking.save();

    // Update room status
    await Room.findByIdAndUpdate(booking.resourceId, {
      isBooked: true,
      status: 'active'
    });

    res.json({ 
      message: 'Check-in completed successfully',
      booking 
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CHECK-OUT APIS

export const searchActiveGuests = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    
    const now = new Date();
    const filter: any = {
      type: 'room',
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true },
      checkIn: { $lte: now },
      checkOut: { $gte: now }
    };

    let bookings: any[] = [];

    if (search) {
      // Search by room number
      const rooms = await Room.find({
        roomNumber: { $regex: search, $options: 'i' }
      }).distinct('_id');

      if (rooms.length > 0) {
        bookings = await Booking.find({
          ...filter,
          resourceId: { $in: rooms }
        })
          .populate('user', 'firstName lastName email phone')
          .populate('resourceId');
      }

      // Also search by guest name
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');

      const bookingsByUser = await Booking.find({
        ...filter,
        user: { $in: users }
      })
        .populate('user', 'firstName lastName email phone')
        .populate('resourceId');

      // Combine results
      bookings = [...bookings, ...bookingsByUser];
      bookings = Array.from(
        new Map(bookings.map(b => [b._id.toString(), b])).values()
      );
    } else {
      // Return all active guests
      bookings = await Booking.find(filter)
        .populate('user', 'firstName lastName email phone')
        .populate('resourceId')
        .sort({ checkIn: -1 })
        .limit(50);
    }

    // Calculate stay duration and amounts for each booking
    const bookingsWithDetails = bookings.map(booking => {
      const checkInDate = new Date(booking.checkIn);
      const now = new Date();
      const stayDuration = Math.ceil((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const extraCharges = (booking as any).extraCharges || 0;
      const amountPaid = booking.paymentStatus === 'paid' ? booking.totalAmount : 0;
      const remaining = booking.totalAmount + extraCharges - amountPaid;

      return {
        ...booking.toObject(),
        stayDuration,
        extraCharges,
        amountPaid,
        remaining
      };
    });

    res.json({ bookings: bookingsWithDetails });
  } catch (error) {
    console.error('Search active guests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addExtraCharge = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, chargeName, amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Initialize extraCharges array if it doesn't exist
    if (!(booking as any).extraCharges) {
      (booking as any).extraCharges = [];
    }

    // Add new charge
    (booking as any).extraCharges.push({
      name: chargeName,
      amount: parseFloat(amount),
      addedAt: new Date(),
      addedBy: `${req.user?.firstName} ${req.user?.lastName}`
    });

    await booking.save();

    res.json({ 
      message: 'Extra charge added successfully',
      booking 
    });
  } catch (error) {
    console.error('Add extra charge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeCheckOut = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, extraCharges, notes } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('resourceId')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.isCheckedIn) {
      return res.status(400).json({ message: 'Guest not checked in yet' });
    }

    if (booking.isCheckedOut) {
      return res.status(400).json({ message: 'Guest already checked out' });
    }

    // Calculate final amount
    const totalExtraCharges = Array.isArray(extraCharges) 
      ? extraCharges.reduce((sum: number, charge: any) => sum + parseFloat(charge.amount), 0)
      : 0;

    const finalAmount = booking.totalAmount + totalExtraCharges;

    // Update booking
    booking.isCheckedOut = true;
    booking.status = 'completed';
    (booking as any).extraCharges = extraCharges || [];
    (booking as any).finalAmount = finalAmount;
    (booking as any).checkOutTime = new Date();
    
    if (notes) {
      booking.specialRequests = booking.specialRequests 
        ? `${booking.specialRequests}\n\nCheck-out notes: ${notes}`
        : `Check-out notes: ${notes}`;
    }

    await booking.save();

    // Update room status to cleaning
    await Room.findByIdAndUpdate(booking.resourceId, {
      isBooked: false,
      status: 'cleaning'
    });

    res.json({ 
      message: 'Check-out completed successfully',
      booking,
      finalAmount
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Calculate invoice details
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = booking.isCheckedOut 
      ? new Date((booking as any).checkOutTime || booking.checkOut)
      : new Date();
    
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const roomCharges = booking.totalAmount;
    const extraCharges = (booking as any).extraCharges || [];
    const totalExtraCharges = Array.isArray(extraCharges)
      ? extraCharges.reduce((sum: number, charge: any) => sum + charge.amount, 0)
      : 0;
    
    const subtotal = roomCharges + totalExtraCharges;
    const tax = subtotal * 0.12; // 12% GST
    const grandTotal = subtotal + tax;

    const invoice = {
      bookingId: booking._id,
      invoiceNumber: `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
      date: new Date(),
      guest: {
        name: `${(booking.user as any).firstName} ${(booking.user as any).lastName}`,
        email: (booking.user as any).email,
        phone: (booking.user as any).phone
      },
      room: {
        number: (booking.resourceId as any).roomNumber,
        type: (booking.resourceId as any).type
      },
      checkIn: booking.checkIn,
      checkOut: checkOutDate,
      nights,
      roomCharges,
      extraCharges,
      totalExtraCharges,
      subtotal,
      tax,
      grandTotal,
      amountPaid: booking.paymentStatus === 'paid' ? roomCharges : 0,
      balance: grandTotal - (booking.paymentStatus === 'paid' ? roomCharges : 0)
    };

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Get recent check-ins
    const recentCheckIns = await Booking.find({
      type: 'room',
      isCheckedIn: true,
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .populate('user', 'firstName lastName')
      .populate('resourceId', 'roomNumber')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get recent check-outs
    const recentCheckOuts = await Booking.find({
      type: 'room',
      isCheckedOut: true,
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .populate('user', 'firstName lastName')
      .populate('resourceId', 'roomNumber')
      .sort({ createdAt: -1 })
      .limit(20);

    // Combine and format activities
    const activities = [
      ...recentCheckIns.map(booking => {
        const bookingObj = booking.toObject() as any;
        return {
          _id: booking._id,
          type: 'checkin' as const,
          bookingId: booking._id.toString().slice(-8).toUpperCase(),
          guestName: booking.user ? 
            `${(booking.user as any).firstName} ${(booking.user as any).lastName}` : 
            'Unknown Guest',
          roomNumber: (booking.resourceId as any)?.roomNumber || 'N/A',
          timestamp: bookingObj.updatedAt || bookingObj.createdAt || new Date(),
          performedBy: 'Manager'
        };
      }),
      ...recentCheckOuts.map(booking => {
        const bookingObj = booking.toObject() as any;
        return {
          _id: booking._id,
          type: 'checkout' as const,
          bookingId: booking._id.toString().slice(-8).toUpperCase(),
          guestName: booking.user ? 
            `${(booking.user as any).firstName} ${(booking.user as any).lastName}` : 
            'Unknown Guest',
          roomNumber: (booking.resourceId as any)?.roomNumber || 'N/A',
          timestamp: bookingObj.updatedAt || bookingObj.createdAt || new Date(),
          performedBy: 'Manager'
        };
      })
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 20);

    res.json({ activities });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
