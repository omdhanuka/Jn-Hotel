import { Request, Response } from 'express';
import Room from '../models/Room';
import Booking from '../models/Booking';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getAllRoomOperations = async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, floor, search } = req.query;
    
    const filter: any = { status: { $ne: 'inactive' } };
    
    if (type && type !== 'all') filter.type = type;
    if (floor) filter.floor = parseInt(floor as string);
    if (search) filter.roomNumber = new RegExp(search as string, 'i');
    
    // Additional status filtering for room operations
    if (status && status !== 'all') {
      if (status === 'available') {
        filter.isBooked = false;
        filter.status = 'active';
      } else if (status === 'occupied') {
        filter.isBooked = true;
      } else if (status === 'cleaning' || status === 'maintenance') {
        filter.status = status;
      }
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });

    // Get current bookings for each room
    const now = new Date();
    const roomsWithBookings = await Promise.all(
      rooms.map(async (room) => {
        const currentBooking = await Booking.findOne({
          type: 'room',
          resourceId: room._id,
          checkIn: { $lte: now },
          checkOut: { $gt: now },
          status: 'confirmed',
          isCheckedIn: true,
          isCheckedOut: { $ne: true }
        }).populate('user', 'firstName lastName email phone');

        return {
          ...room.toObject(),
          currentGuest: currentBooking ? {
            name: currentBooking.user ? 
              `${(currentBooking.user as any).firstName} ${(currentBooking.user as any).lastName}` : 
              'Unknown Guest',
            email: (currentBooking.user as any)?.email || '',
            phone: (currentBooking.user as any)?.phone || '',
            bookingId: currentBooking._id.toString().slice(-8).toUpperCase(),
            fullBookingId: currentBooking._id,
            checkIn: currentBooking.checkIn,
            checkOut: currentBooking.checkOut,
            guests: currentBooking.guests,
            paymentStatus: currentBooking.paymentStatus,
            totalAmount: currentBooking.totalAmount
          } : null
        };
      })
    );

    res.json({ 
      rooms: roomsWithBookings,
      count: roomsWithBookings.length 
    });
  } catch (error) {
    console.error('Get room operations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoomOperationDetails = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get current booking if room is occupied
    let currentBooking = null;
    if (room.isBooked) {
      const now = new Date();
      const booking = await Booking.findOne({
        type: 'room',
        resourceId: room._id,
        checkIn: { $lte: now },
        checkOut: { $gt: now },
        status: 'confirmed',
        isCheckedIn: true,
        isCheckedOut: { $ne: true }
      }).populate('user', 'firstName lastName email phone');

      if (booking) {
        currentBooking = {
          ...booking.toObject(),
          guestName: booking.user ? 
            `${(booking.user as any).firstName} ${(booking.user as any).lastName}` : 
            'Unknown Guest'
        };
      }
    }

    res.json({ 
      room: room.toObject(),
      currentBooking 
    });
  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRoomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['active', 'maintenance', 'cleaning'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid room status' });
    }

    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Cannot change status if room is currently occupied
    if (room.isBooked && (status === 'maintenance' || status === 'cleaning')) {
      return res.status(400).json({ 
        message: 'Cannot change status while room is occupied. Checkout guest first.' 
      });
    }

    room.status = status;
    await room.save();

    res.json({ 
      message: `Room ${room.roomNumber} marked as ${status}`,
      room 
    });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignRoomToBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isBooked) {
      return res.status(400).json({ message: 'Room is already occupied' });
    }

    if (room.status !== 'active') {
      return res.status(400).json({ 
        message: `Room is under ${room.status}. Please complete ${room.status} first.` 
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.type !== 'room') {
      return res.status(400).json({ message: 'This is not a room booking' });
    }

    // Update booking with room assignment
    booking.resourceId = room._id;
    booking.isCheckedIn = true;
    await booking.save();

    // Update room status
    room.isBooked = true;
    await room.save();

    res.json({ 
      message: `Room ${room.roomNumber} assigned successfully`,
      room,
      booking 
    });
  } catch (error) {
    console.error('Assign room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const releaseRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isBooked) {
      return res.status(400).json({ message: 'Room is not currently occupied' });
    }

    // Find and checkout current booking
    const now = new Date();
    const booking = await Booking.findOne({
      type: 'room',
      resourceId: room._id,
      checkIn: { $lte: now },
      checkOut: { $gt: now },
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    });

    if (booking) {
      booking.isCheckedOut = true;
      booking.status = 'completed';
      await booking.save();
    }

    // Release room and mark for cleaning
    room.isBooked = false;
    room.status = 'cleaning';
    await room.save();

    res.json({ 
      message: `Guest checked out from Room ${room.roomNumber}. Room marked for cleaning.`,
      room 
    });
  } catch (error) {
    console.error('Release room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const moveGuestToAnotherRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { newRoomId, reason } = req.body;
    const oldRoomId = req.params.id;

    // Validate old room
    const oldRoom = await Room.findById(oldRoomId);
    if (!oldRoom) {
      return res.status(404).json({ message: 'Current room not found' });
    }

    if (!oldRoom.isBooked) {
      return res.status(400).json({ message: 'No guest in current room' });
    }

    // Validate new room
    const newRoom = await Room.findById(newRoomId);
    if (!newRoom) {
      return res.status(404).json({ message: 'New room not found' });
    }

    if (newRoom.isBooked) {
      return res.status(400).json({ message: 'New room is already occupied' });
    }

    if (newRoom.status !== 'active') {
      return res.status(400).json({ 
        message: `New room is under ${newRoom.status}` 
      });
    }

    // Find current booking
    const now = new Date();
    const booking = await Booking.findOne({
      type: 'room',
      resourceId: oldRoomId,
      checkIn: { $lte: now },
      checkOut: { $gt: now },
      status: 'confirmed',
      isCheckedIn: true,
      isCheckedOut: { $ne: true }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Active booking not found' });
    }

    // Move guest
    booking.resourceId = newRoom._id;
    booking.specialRequests = booking.specialRequests ? 
      `${booking.specialRequests}\n\nRoom changed from ${oldRoom.roomNumber} to ${newRoom.roomNumber}. Reason: ${reason}` :
      `Room changed from ${oldRoom.roomNumber} to ${newRoom.roomNumber}. Reason: ${reason}`;
    await booking.save();

    // Update old room
    oldRoom.isBooked = false;
    oldRoom.status = 'cleaning';
    await oldRoom.save();

    // Update new room
    newRoom.isBooked = true;
    await newRoom.save();

    res.json({ 
      message: `Guest moved from Room ${oldRoom.roomNumber} to Room ${newRoom.roomNumber}`,
      oldRoom: oldRoom.toObject(),
      newRoom: newRoom.toObject(),
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Move guest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeCleaningOrMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'cleaning' && room.status !== 'maintenance') {
      return res.status(400).json({ 
        message: 'Room is not under cleaning or maintenance' 
      });
    }

    const previousStatus = room.status;
    room.status = 'active';
    await room.save();

    res.json({ 
      message: `${previousStatus.charAt(0).toUpperCase() + previousStatus.slice(1)} completed for Room ${room.roomNumber}`,
      room 
    });
  } catch (error) {
    console.error('Complete cleaning/maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAvailableRoomsForMove = async (req: AuthRequest, res: Response) => {
  try {
    const { roomType, minGuests } = req.query;
    
    const filter: any = {
      isBooked: false,
      status: 'active'
    };
    
    if (roomType) filter.type = roomType;
    if (minGuests) filter.maxGuests = { $gte: parseInt(minGuests as string) };

    const availableRooms = await Room.find(filter)
      .sort({ roomNumber: 1 })
      .select('roomNumber type floor maxGuests price');

    res.json({ rooms: availableRooms });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createManualBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      roomId, 
      customerDetails, 
      checkIn, 
      checkOut, 
      guests, 
      specialRequests,
      paymentMethod,
      advanceAmount
    } = req.body;

    // Validate required fields
    if (!roomId || !customerDetails || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate customer details
    if (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.phone) {
      return res.status(400).json({ 
        message: 'Customer first name, last name, and phone are required' 
      });
    }

    // Validate room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isBooked) {
      return res.status(400).json({ message: 'Room is already occupied' });
    }

    if (room.status !== 'active') {
      return res.status(400).json({ 
        message: `Room is currently under ${room.status}` 
      });
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Calculate total amount
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = room.price * nights;

    // Import User model at the top if not already imported
    const User = (await import('../models/User')).default;

    // Create or find guest user
    let guestUser;
    const existingUser = await User.findOne({ phone: customerDetails.phone });

    if (existingUser) {
      // Use existing user
      guestUser = existingUser;
    } else {
      // Create new guest user for offline booking
      guestUser = await User.create({
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName,
        email: customerDetails.email || `guest_${Date.now()}@offline.booking`,
        phone: customerDetails.phone,
        password: Math.random().toString(36).slice(-8), // Random password
        role: 'guest',
        isVerified: false,
        isActive: true
      });
    }

    // Create booking
    const booking = await Booking.create({
      user: guestUser._id,
      type: 'room',
      resourceId: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalAmount,
      status: 'confirmed',
      paymentStatus: advanceAmount >= totalAmount ? 'paid' : 'pending',
      paymentMethod: paymentMethod || 'cash',
      specialRequests: specialRequests ? 
        `${specialRequests}\n\nManual booking by manager: ${req.user?.firstName} ${req.user?.lastName}` :
        `Manual booking by manager: ${req.user?.firstName} ${req.user?.lastName}`,
      isCheckedIn: true,
      isCheckedOut: false
    });

    // Update room status
    room.isBooked = true;
    await room.save();

    // Populate booking with user details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email phone');

    res.status(201).json({ 
      message: 'Manual booking created successfully',
      booking: populatedBooking,
      room: room.toObject()
    });
  } catch (error) {
    console.error('Create manual booking error:', error);
    res.status(500).json({ message: 'Server error creating manual booking' });
  }
};
