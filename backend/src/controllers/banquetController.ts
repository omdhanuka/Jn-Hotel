import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Banquet from '../models/Banquet';
import Booking from '../models/Booking';

export const getBanquets = async (req: Request, res: Response) => {
  try {
    const { capacity, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    const filter: any = { isAvailable: true };
    
    if (capacity) filter.capacity = { $gte: parseInt(capacity as string) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice as string);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice as string);
    }

    const banquets = await Banquet.find(filter)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ capacity: 1 });

    const total = await Banquet.countDocuments(filter);

    res.json({
      banquets,
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

export const getBanquetById = async (req: Request, res: Response) => {
  try {
    const banquet = await Banquet.findById(req.params.id);
    
    if (!banquet) {
      return res.status(404).json({ message: 'Banquet hall not found' });
    }

    res.json(banquet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkBanquetAvailability = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, guests } = req.body;
    
    const filter: any = { 
      isAvailable: true,
      capacity: { $gte: guests }
    };

    // Find banquets not booked for the requested date
    const bookedBanquetIds = await Booking.find({
      type: 'banquet',
      status: { $in: ['confirmed', 'pending'] },
      checkIn: {
        $lte: new Date(date + 'T23:59:59.999Z')
      },
      checkOut: {
        $gte: new Date(date + 'T00:00:00.000Z')
      }
    }).distinct('resourceId');

    filter._id = { $nin: bookedBanquetIds };

    const availableBanquets = await Banquet.find(filter);

    res.json({ availableBanquets, count: availableBanquets.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBanquet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const banquet = new Banquet(req.body);
    await banquet.save();

    res.status(201).json(banquet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBanquet = async (req: Request, res: Response) => {
  try {
    const banquet = await Banquet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!banquet) {
      return res.status(404).json({ message: 'Banquet hall not found' });
    }

    res.json(banquet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBanquet = async (req: Request, res: Response) => {
  try {
    const banquet = await Banquet.findByIdAndDelete(req.params.id);

    if (!banquet) {
      return res.status(404).json({ message: 'Banquet hall not found' });
    }

    res.json({ message: 'Banquet hall deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
