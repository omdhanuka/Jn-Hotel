import { Request, Response } from 'express';
import Bill from '../models/Bill';
import RestaurantBooking from '../models/RestaurantBooking';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

// Generate Restaurant Bill (Dine-in, Takeaway, Delivery)
export const createBill = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Creating bill with data:', req.body);
    
    const {
      orderId,
      customerName,
      customerPhone,
      tableNumber,
      deliveryType,
      deliveryAddress,
      items,
      subtotal,
      discount,
      taxPercentage,
      deliveryCharges,
      paymentMethod,
      notes
    } = req.body;

    // Calculate tax amount
    const taxAmount = (subtotal * (taxPercentage || 10)) / 100;
    const totalAmount = subtotal - discount + taxAmount + (deliveryCharges || 0);

    // Generate bill number manually if needed
    const count = await Bill.countDocuments();
    const billNumber = `RB${String(count + 1).padStart(6, '0')}`;

    const bill = new Bill({
      billNumber, // Set it explicitly
      billType: 'restaurant',
      orderId,
      customerName,
      customerPhone,
      tableNumber,
      deliveryType,
      deliveryAddress,
      items,
      subtotal,
      discount,
      tax: taxAmount,
      deliveryCharges: deliveryCharges || 0,
      totalAmount,
      paymentMethod,
      paymentStatus: 'paid',
      notes,
      generatedBy: req.user!._id
    });

    console.log('Bill before save:', bill);
    
    await bill.save();
    
    console.log('Bill saved successfully:', bill.billNumber);

    res.status(201).json({ 
      message: 'Bill generated successfully', 
      bill 
    });
  } catch (error) {
    console.error('Restaurant bill generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bills with filters
export const getBills = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      billType, 
      deliveryType, 
      paymentStatus
    } = req.query;

    const filter: any = {};
    if (billType) filter.billType = billType;
    if (deliveryType) filter.deliveryType = deliveryType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const bills = await Bill.find(filter)
      .populate('generatedBy', 'firstName lastName')
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

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

// Get bill by ID
export const getBillById = async (req: AuthRequest, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id)
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
