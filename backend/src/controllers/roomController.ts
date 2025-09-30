import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Room from '../models/Room';
import Booking from '../models/Booking';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const { type, minPrice, maxPrice, capacity, page = 1, limit = 10 } = req.query;
    
    const filter: any = { isAvailable: true };
    
    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: parseInt(capacity as string) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice as string);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice as string);
    }

    const rooms = await Room.find(filter)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ price: 1 });

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
      capacity: { $gte: guests }
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

export const createRoom = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const room = new Room(req.body);
    await room.save();

    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
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

export const seedRooms = async (req: Request, res: Response) => {
  try {
    // Check if rooms already exist
    const existingRooms = await Room.countDocuments();
    if (existingRooms > 0) {
      return res.json({ message: 'Rooms already exist in database', count: existingRooms });
    }

    const sampleRooms = [
      {
        roomNumber: '101',
        type: 'standard',
        capacity: 2,
        price: 149,
        amenities: ['Free Wi-Fi', 'Air Conditioning', 'Work Desk', 'Flat Screen TV'],
        images: ['/api/placeholder/400/300'],
        description: 'Comfortable standard room with modern amenities',
        floor: 1,
        isAvailable: true
      },
      {
        roomNumber: '201',
        type: 'deluxe',
        capacity: 2,
        price: 199,
        amenities: ['Free Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Room Service', 'City View'],
        images: ['/api/placeholder/400/300'],
        description: 'Spacious deluxe room with king-size bed and city view',
        floor: 2,
        isAvailable: true
      },
      {
        roomNumber: '301',
        type: 'suite',
        capacity: 4,
        price: 299,
        amenities: ['Free Wi-Fi', 'Kitchenette', 'Balcony', 'Living Area', 'Premium Bedding'],
        images: ['/api/placeholder/400/300'],
        description: 'Luxurious suite with separate living area and premium amenities',
        floor: 3,
        isAvailable: true
      },
      {
        roomNumber: '401',
        type: 'presidential',
        capacity: 6,
        price: 599,
        amenities: ['Free Wi-Fi', 'Full Kitchen', 'Private Balcony', 'Butler Service', 'Jacuzzi'],
        images: ['/api/placeholder/400/300'],
        description: 'Presidential suite with panoramic views and luxury amenities',
        floor: 4,
        isAvailable: true
      },
      {
        roomNumber: '102',
        type: 'standard',
        capacity: 2,
        price: 149,
        amenities: ['Free Wi-Fi', 'Air Conditioning', 'Work Desk', 'Flat Screen TV'],
        images: ['/api/placeholder/400/300'],
        description: 'Comfortable standard room with modern amenities',
        floor: 1,
        isAvailable: true
      },
      {
        roomNumber: '202',
        type: 'deluxe',
        capacity: 3,
        price: 229,
        amenities: ['Free Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Garden View'],
        images: ['/api/placeholder/400/300'],
        description: 'Deluxe room with garden view and additional space',
        floor: 2,
        isAvailable: true
      }
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
