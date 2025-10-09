import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Room from '../models/Room';
import Booking from '../models/Booking';

interface AuthRequest extends Request {
  user?: any;
}

export const getRooms = async (req: Request, res: Response) => {
  try {
    const { type, minPrice, maxPrice, capacity, page = 1, limit = 10, status = 'active' } = req.query;
    
    const filter: any = { 
      isAvailable: true,
      status: status || 'active'
    };
    
    if (type) filter.type = type;
    if (capacity) filter.maxGuests = { $gte: parseInt(capacity as string) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice as string);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice as string);
    }

    const rooms = await Room.find(filter)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ roomNumber: 1 });

    const total = await Room.countDocuments(filter);

    res.json({
      rooms,
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

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { checkIn, checkOut, guests, roomType } = req.body;
    
    const filter: any = { 
      isAvailable: true,
      status: 'active',
      maxGuests: { $gte: guests }
    };
    
    if (roomType) filter.type = roomType;

    // Find rooms not booked during the requested period
    const bookedRoomIds = await Booking.find({
      type: 'room',
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
    }).distinct('resourceId');

    filter._id = { $nin: bookedRoomIds };

    const availableRooms = await Room.find(filter);

    res.json({ availableRooms, count: availableRooms.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Add created by admin info
    const roomData = {
      ...req.body,
      createdBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const room = new Room(roomData);
    await room.save();

    res.status(201).json(room);
  } catch (error: any) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Room number already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const updateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// This code block appears to be misplaced and should be part of a function. 
// Wrap it in a function or remove it if unnecessary.
export const seedRooms = async (req: Request, res: Response) => {
  try {
    interface SampleRoom {
      roomNumber: number;
      type: string;
      price: number;
      maxGuests: number;
      isAvailable: boolean;
      status: string;
    }

    const sampleRooms: SampleRoom[] = [
      // Add sample room data here
    ];

    const createdRooms = await Room.insertMany(sampleRooms);

    res.status(201).json({
      message: 'Sample rooms created successfully',
      count: createdRooms.length,
      rooms: createdRooms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while seeding rooms' });
  }
};
