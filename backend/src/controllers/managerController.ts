import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Banquet from '../models/Banquet';
import RestaurantBooking from '../models/RestaurantBooking';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getManagerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get stats
    const totalBookings = await Booking.countDocuments();
    const todayCheckIns = await Booking.countDocuments({
      type: 'room',
      checkIn: { $gte: today },
      status: 'confirmed'
    });
    const todayCheckOuts = await Booking.countDocuments({
      type: 'room',
      checkOut: { $gte: today },
      status: 'confirmed'
    });
    
    const occupiedRooms = await Booking.countDocuments({
      type: 'room',
      status: 'confirmed',
      checkIn: { $lte: new Date() },
      checkOut: { $gt: new Date() }
    });
    
    const totalRooms = await Room.countDocuments({ status: 'active' });
    const availableRooms = totalRooms - occupiedRooms;

    const pendingTasks = 0; // Implement task system
    const pendingComplaints = 0; // Implement complaint system

    res.json({
      totalBookings,
      todayCheckIns,
      todayCheckOuts,
      occupiedRooms,
      availableRooms,
      pendingTasks,
      pendingComplaints
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCalendarBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, type = 'all' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    console.log('=== CALENDAR BOOKINGS QUERY ===');
    console.log('Date Range:', start, 'to', end);
    console.log('Filter Type:', type);

    // Fetch room bookings
    let roomBookings: any[] = [];
    if (type === 'all' || type === 'room') {
      const bookings = await Booking.find({
        type: 'room',
        status: { $ne: 'cancelled' }, // Exclude cancelled bookings
        $or: [
          { checkIn: { $gte: start, $lte: end } },
          { checkOut: { $gte: start, $lte: end } },
          { checkIn: { $lte: start }, checkOut: { $gte: end } }
        ]
      })
        .populate('user', 'firstName lastName email phone')
        .sort({ checkIn: 1 })
        .lean();

      console.log(`✓ Found ${bookings.length} room bookings (excluding cancelled)`);
      
      // Debug: Log all room bookings with dates
      bookings.forEach((booking, index) => {
        console.log(`Room Booking ${index + 1}:`, {
          id: booking._id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          resourceId: booking.resourceId,
          status: booking.status
        });
      });

      // Manually populate room data
      for (const booking of bookings) {
        const room = await Room.findById(booking.resourceId).select('roomNumber type').lean();
        if (room) {
          console.log(`Room ${room.roomNumber} - CheckIn: ${booking.checkIn}, CheckOut: ${booking.checkOut}`);
          roomBookings.push({ ...booking, resourceId: room });
        } else {
          console.log(`⚠ Room not found for booking ${booking._id}`);
        }
      }
    }

    // Fetch banquet bookings
    let banquetBookings: any[] = [];
    if (type === 'all' || type === 'banquet') {
      // First check total banquet bookings in DB
      const totalBanquetBookings = await Booking.countDocuments({ type: 'banquet' });
      console.log(`📊 Total banquet bookings in database: ${totalBanquetBookings}`);

      const bookings = await Booking.find({
        type: 'banquet',
        status: { $ne: 'cancelled' }, // Exclude cancelled bookings
        $or: [
          { checkIn: { $gte: start, $lte: end } },
          { checkOut: { $gte: start, $lte: end } },
          { checkIn: { $lte: start }, checkOut: { $gte: end } }
        ]
      })
        .populate('user', 'firstName lastName email phone')
        .sort({ checkIn: 1 })
        .lean();

      console.log(`✓ Found ${bookings.length} banquet bookings in date range (excluding cancelled)`);
      
      if (bookings.length > 0) {
        console.log('Sample banquet booking:', JSON.stringify(bookings[0], null, 2));
      }

      // Manually populate banquet data
      for (const booking of bookings) {
        const banquet = await Banquet.findById(booking.resourceId).select('name capacity').lean();
        if (banquet) {
          console.log(`✓ Banquet found: ${banquet.name} for booking ${booking._id}`);
          banquetBookings.push({ ...booking, resourceId: banquet });
        } else {
          console.log(`⚠ Banquet NOT found for booking ${booking._id}, resourceId: ${booking.resourceId}`);
        }
      }
    }

    // Format bookings for calendar
    const formattedRoomBookings = roomBookings.map(booking => ({
      id: booking._id,
      title: `Room ${(booking.resourceId as any)?.roomNumber || 'N/A'} - ${(booking.user as any)?.firstName || ''} ${(booking.user as any)?.lastName || ''}`,
      start: booking.checkIn,
      end: booking.checkOut,
      type: 'room',
      status: booking.status,
      resourceName: `Room ${(booking.resourceId as any)?.roomNumber || 'N/A'}`,
      resourceType: (booking.resourceId as any)?.type || 'N/A',
      guestName: `${(booking.user as any)?.firstName || ''} ${(booking.user as any)?.lastName || ''}`,
      guestPhone: (booking.user as any)?.phone || '',
      guests: booking.guests,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      isCheckedIn: booking.isCheckedIn,
      isCheckedOut: booking.isCheckedOut
    }));

    const formattedBanquetBookings = banquetBookings.map(booking => ({
      id: booking._id,
      title: `${(booking.resourceId as any)?.name || 'Banquet'} - ${(booking.user as any)?.firstName || ''} ${(booking.user as any)?.lastName || ''}`,
      start: booking.checkIn,
      end: booking.checkOut,
      type: 'banquet',
      status: booking.status,
      resourceName: (booking.resourceId as any)?.name || 'N/A',
      resourceCapacity: (booking.resourceId as any)?.capacity || 0,
      guestName: `${(booking.user as any)?.firstName || ''} ${(booking.user as any)?.lastName || ''}`,
      guestPhone: (booking.user as any)?.phone || '',
      guests: booking.guests,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      eventType: booking.eventDetails?.eventType || 'N/A'
    }));

    const allBookings = [...formattedRoomBookings, ...formattedBanquetBookings].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    console.log('Calendar Bookings - Room:', formattedRoomBookings.length, 'Banquet:', formattedBanquetBookings.length);
    console.log('Sample room booking:', formattedRoomBookings[0]);
    console.log('Sample banquet booking:', formattedBanquetBookings[0]);

    res.json({
      bookings: allBookings,
      roomBookings: formattedRoomBookings,
      banquetBookings: formattedBanquetBookings,
      stats: {
        totalBookings: allBookings.length,
        roomBookings: formattedRoomBookings.length,
        banquetBookings: formattedBanquetBookings.length
      }
    });
  } catch (error) {
    console.error('Get calendar bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBookingsForManager = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      type = 'all', 
      status = 'all',
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for regular bookings (room & banquet)
    const bookingFilter: any = {};
    
    if (type !== 'all') {
      if (type === 'room') bookingFilter.type = 'room';
      if (type === 'banquet') bookingFilter.type = 'banquet';
    }
    
    if (status !== 'all') bookingFilter.status = status;
    
    if (startDate || endDate) {
      bookingFilter.checkIn = {};
      if (startDate) bookingFilter.checkIn.$gte = new Date(startDate as string);
      if (endDate) bookingFilter.checkIn.$lte = new Date(endDate as string);
    }

    // Fetch room & banquet bookings
    let bookingsPromise = Promise.resolve([]);
    if (type === 'all' || type === 'room' || type === 'banquet') {
      bookingsPromise = Booking.find(bookingFilter)
        .populate('user', 'firstName lastName email phone')
        .populate('resourceId')
        .lean();
    }

    // Fetch restaurant bookings
    let restaurantBookingsPromise = Promise.resolve([]);
    if (type === 'all' || type === 'restaurant') {
      const restaurantFilter: any = {};
      if (status !== 'all') restaurantFilter.status = status;
      if (startDate || endDate) {
        if (startDate) restaurantFilter.date = { $gte: new Date(startDate as string) };
        if (endDate) restaurantFilter.date = { ...restaurantFilter.date, $lte: new Date(endDate as string) };
      }
      
      restaurantBookingsPromise = RestaurantBooking.find(restaurantFilter)
        .populate('user', 'firstName lastName email phone')
        .lean();
    }

    const [roomBanquetBookings, restaurantBookings] = await Promise.all([
      bookingsPromise,
      restaurantBookingsPromise
    ]);

    // Transform bookings to unified format
    const unifiedBookings = [
      ...roomBanquetBookings.map((b: any) => ({
        _id: b._id,
        bookingId: b._id.toString().slice(-8).toUpperCase(),
        bookingType: b.type,
        guestName: b.user ? `${b.user.firstName} ${b.user.lastName}` : 'N/A',
        email: b.user?.email || '',
        phone: b.user?.phone || '',
        date: b.checkIn,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        guests: b.guests,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalAmount: b.totalAmount,
        resourceDetails: b.resourceId,
        specialRequests: b.specialRequests,
        createdAt: b.createdAt
      })),
      ...restaurantBookings.map((b: any) => ({
        _id: b._id,
        bookingId: b.bookingId || b._id.toString().slice(-8).toUpperCase(),
        bookingType: b.bookingType === 'table' ? 'restaurant' : 'restaurant-order',
        guestName: b.fullName || (b.user ? `${b.user.firstName} ${b.user.lastName}` : 'N/A'),
        email: b.email || b.user?.email || '',
        phone: b.phone || b.user?.phone || '',
        date: b.date || b.createdAt,
        checkIn: b.date,
        checkOut: null,
        guests: b.numberOfGuests || 1,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalAmount: b.totalAmount,
        resourceDetails: { tableNumber: b.tableNumber },
        specialRequests: b.specialRequests,
        createdAt: b.createdAt
      }))
    ];

    // Apply search filter
    let filteredBookings = unifiedBookings;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredBookings = unifiedBookings.filter(b => 
        b.guestName.toLowerCase().includes(searchLower) ||
        b.email.toLowerCase().includes(searchLower) ||
        b.phone.includes(searchLower) ||
        b.bookingId.toLowerCase().includes(searchLower)
      );
    }

    // Sort bookings
    const sortField = sortBy as string;
    const order = sortOrder === 'desc' ? -1 : 1;
    filteredBookings.sort((a: any, b: any) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });

    // Pagination
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

    res.json({
      bookings: paginatedBookings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: filteredBookings.length,
        pages: Math.ceil(filteredBookings.length / parseInt(limit as string))
      },
      stats: {
        total: filteredBookings.length,
        confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
        pending: filteredBookings.filter(b => b.status === 'pending').length,
        cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
        completed: filteredBookings.filter(b => b.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Get manager bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookingDetailsForManager = async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = req.params.id;

    // Try to find in regular bookings
    let booking = await Booking.findById(bookingId)
      .populate('user', 'firstName lastName email phone')
      .populate('resourceId');

    if (booking) {
      return res.json({ booking, source: 'booking' });
    }

    // Try restaurant bookings
    const restaurantBooking = await RestaurantBooking.findById(bookingId)
      .populate('user', 'firstName lastName email phone');

    if (restaurantBooking) {
      return res.json({ booking: restaurantBooking, source: 'restaurant' });
    }

    res.status(404).json({ message: 'Booking not found' });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBookingByManager = async (req: AuthRequest, res: Response) => {
  try {
    const { checkIn, checkOut, guests, specialRequests } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Managers can update these fields
    if (checkIn) booking.checkIn = new Date(checkIn);
    if (checkOut) booking.checkOut = new Date(checkOut);
    if (guests) booking.guests = guests;
    if (specialRequests !== undefined) booking.specialRequests = specialRequests;

    await booking.save();

    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      booking.status = status;
      
      // Handle room status based on booking status
      if (booking.type === 'room') {
        if (status === 'cancelled') {
          await Room.findByIdAndUpdate(booking.resourceId, { isBooked: false });
        }
      }
    }

    // Update payment status if provided
    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email')
      .populate('resourceId');

    res.json({ 
      message: 'Booking updated successfully', 
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignResource = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate resource exists based on booking type
    if (booking.type === 'room') {
      const room = await Room.findById(resourceId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      if (room.isBooked) {
        return res.status(400).json({ message: 'Room is already booked' });
      }
    } else if (booking.type === 'banquet') {
      const banquet = await Banquet.findById(resourceId);
      if (!banquet) {
        return res.status(404).json({ message: 'Banquet hall not found' });
      }
    }

    // Update booking with new resource
    booking.resourceId = resourceId;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email')
      .populate('resourceId');

    res.json({ 
      message: 'Resource assigned successfully', 
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Assign resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
