import { Request, Response } from 'express';
import Bill from '../models/Bill';
import RestaurantBooking from '../models/RestaurantBooking';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const createBill = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const {
      orderId,
      tableNumber,
      customerName,
      items,
      subtotal,
      discount,
      tax,
      totalAmount,
      paymentMethod,
      notes
    } = req.body;

    // Verify the order exists
    const order = await RestaurantBooking.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const bill = new Bill({
      orderId,
      tableNumber,
      customerName,
      items,
      subtotal,
      discount,
      tax,
      totalAmount,
      paymentMethod,
      notes,
      generatedBy: req.user!._id
    });

    await bill.save();

    res.status(201).json(bill);
  } catch (error) {
    console.error('Bill creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBills = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { page = 1, limit = 20, tableNumber } = req.query;
    
    const filter: any = {};
    if (tableNumber) filter.tableNumber = tableNumber;

    const bills = await Bill.find(filter)
      .populate('orderId')
      .populate('generatedBy', 'firstName lastName')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ generatedAt: -1 });

    const total = await Bill.countDocuments(filter);

    res.json({
      bills,
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

export const getBillById = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const bill = await Bill.findById(req.params.id)
      .populate('orderId')
      .populate('generatedBy', 'firstName lastName');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
