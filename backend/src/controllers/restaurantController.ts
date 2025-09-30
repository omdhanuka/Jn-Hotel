import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Table from '../models/Table';
import Booking from '../models/Booking';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getTables = async (req: Request, res: Response) => {
  try {
    const { location, capacity, page = 1, limit = 10 } = req.query;
    
    const filter: any = { isAvailable: true };
    
    if (location) filter.location = location;
    if (capacity) filter.capacity = { $gte: parseInt(capacity as string) };

    const tables = await Table.find(filter)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ tableNumber: 1 });

    const total = await Table.countDocuments(filter);

    res.json({
      tables,
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

export const getTableById = async (req: Request, res: Response) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkTableAvailability = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, time, guests } = req.body;
    
    const filter: any = { 
      isAvailable: true,
      capacity: { $gte: guests }
    };

    // Create date range for the reservation (assuming 2-hour slots)
    const reservationStart = new Date(`${date}T${time}:00.000Z`);
    const reservationEnd = new Date(reservationStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    // Find tables not booked during the requested time
    const bookedTableIds = await Booking.find({
      type: 'table',
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { $lte: reservationStart },
          checkOut: { $gt: reservationStart }
        },
        {
          checkIn: { $lt: reservationEnd },
          checkOut: { $gte: reservationEnd }
        },
        {
          checkIn: { $gte: reservationStart },
          checkOut: { $lte: reservationEnd }
        }
      ]
    }).distinct('resourceId');

    filter._id = { $nin: bookedTableIds };

    const availableTables = await Table.find(filter);

    res.json({ availableTables, count: availableTables.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const makeReservation = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tableId, date, time, guests, specialRequests } = req.body;
    
    // Check if table exists and is available
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (!table.isAvailable) {
      return res.status(400).json({ message: 'Table is not available' });
    }

    // Create reservation dates
    const checkIn = new Date(`${date}T${time}:00.000Z`);
    const checkOut = new Date(checkIn.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    // Check for conflicting reservations
    const conflictingBooking = await Booking.findOne({
      type: 'table',
      resourceId: tableId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { $lte: checkIn },
          checkOut: { $gt: checkIn }
        },
        {
          checkIn: { $lt: checkOut },
          checkOut: { $gte: checkOut }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Table is already booked for this time slot' });
    }

    // Create booking
    const booking = new Booking({
      user: req.user!._id,
      type: 'table',
      resourceId: tableId,
      checkIn,
      checkOut,
      guests,
      totalAmount: 0, // Table reservations might be free or have a minimum charge
      specialRequests
    });

    await booking.save();

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const table = new Table(req.body);
    await table.save();

    res.status(201).json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
