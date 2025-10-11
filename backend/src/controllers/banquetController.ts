import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Banquet from '../models/Banquet';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getBanquets = async (req: Request, res: Response) => {
  try {
    const { type, capacity, page = 1, limit = 10, status = 'active' } = req.query;
    
    const filter: any = { 
      isAvailable: true,
      status: status || 'active'
    };
    
    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: parseInt(capacity as string) };

    const banquets = await Banquet.find(filter)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ name: 1 });

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
      return res.status(404).json({ message: 'Banquet not found' });
    }

    res.json(banquet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBanquet = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Generate unique banquet ID
    const banquetCount = await Banquet.countDocuments();
    const banquetId = `BH${String(banquetCount + 1).padStart(3, '0')}`;

    const banquetData = {
      ...req.body,
      banquetId,
      createdBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const banquet = new Banquet(banquetData);
    await banquet.save();

    res.status(201).json(banquet);
  } catch (error: any) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Banquet ID already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const updateBanquet = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const banquet = await Banquet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!banquet) {
      return res.status(404).json({ message: 'Banquet not found' });
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
      return res.status(404).json({ message: 'Banquet not found' });
    }

    res.json({ message: 'Banquet deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
