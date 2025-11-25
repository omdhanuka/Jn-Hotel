import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import RestaurantBooking from '../models/RestaurantBooking';
import MenuItem from '../models/MenuItem';
import RestaurantTable from '../models/RestaurantTable';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const createRestaurantBooking = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      bookingType, fullName, email, phone, tableId, tableNumber, date, timeSlot, 
      numberOfGuests, items, deliveryType, deliveryAddress, 
      paymentMethod, specialRequests, couponCode 
    } = req.body;

    // Validation for dine-in orders
    if (bookingType === 'order' && deliveryType === 'dine-in' && !tableNumber) {
      return res.status(400).json({ message: 'Table number is required for dine-in orders' });
    }

    // Generate unique booking ID
    const bookingCount = await RestaurantBooking.countDocuments();
    const bookingId = `REST${String(bookingCount + 1).padStart(4, '0')}`;

    let totalAmount = 0;

    // Validate table booking
    if (bookingType === 'table') {
      if (!tableId || !date || !timeSlot || !numberOfGuests) {
        return res.status(400).json({ message: 'Table booking requires table, date, time slot, and number of guests' });
      }

      const table = await RestaurantTable.findById(tableId);
      if (!table || !table.isAvailable) {
        return res.status(400).json({ message: 'Table not available' });
      }

      if (numberOfGuests > table.seatingCapacity) {
        return res.status(400).json({ message: `Table can accommodate maximum ${table.seatingCapacity} guests` });
      }

      // Check for existing booking conflicts
      const conflictingBooking = await RestaurantBooking.findOne({
        bookingType: 'table',
        tableId,
        date: new Date(date),
        timeSlot,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (conflictingBooking) {
        return res.status(400).json({ message: 'Table already booked for this time slot' });
      }

      totalAmount = table.price || 0;
    }

    // Validate and calculate food order amount
    if (items && items.length > 0) {
      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem || !menuItem.isAvailable) {
          return res.status(400).json({ message: `Menu item ${item.name} not available` });
        }
        
        let itemTotal = menuItem.price * item.quantity;
        
        // Add add-ons cost
        if (item.addOns) {
          for (const addon of item.addOns) {
            itemTotal += addon.price * item.quantity;
          }
        }
        
        totalAmount += itemTotal;
      }
    }

    // Apply discount if coupon code is provided
    let discount = 0;
    if (couponCode) {
      // Simple discount logic - can be enhanced
      if (couponCode === 'FIRST10') {
        discount = totalAmount * 0.1;
      } else if (couponCode === 'WELCOME20') {
        discount = totalAmount * 0.2;
      }
    }

    const finalAmount = totalAmount - discount;

    // Set payment method and status for dine-in orders
    let finalPaymentMethod = paymentMethod;
    let paymentStatus = 'pending';
    
    if (bookingType === 'order' && deliveryType === 'dine-in') {
      finalPaymentMethod = 'cash'; // Default to cash for dine-in
      paymentStatus = 'pending'; // Will be paid at restaurant
    }

    const bookingData = {
      user: req.user!._id,
      bookingId,
      bookingType,
      fullName,
      email,
      phone,
      tableId: bookingType === 'table' ? tableId : undefined,
      tableNumber: deliveryType === 'dine-in' ? tableNumber : undefined,
      date: bookingType === 'table' ? new Date(date) : undefined,
      timeSlot: bookingType === 'table' ? timeSlot : undefined,
      numberOfGuests: bookingType === 'table' ? numberOfGuests : undefined,
      items: items || [],
      totalAmount: finalAmount,
      deliveryType,
      deliveryAddress,
      paymentMethod: finalPaymentMethod,
      paymentStatus,
      specialRequests,
      couponCode,
      discount
    };

    const booking = new RestaurantBooking(bookingData);
    await booking.save();

    const populatedBooking = await RestaurantBooking.findById(booking._id)
      .populate('tableId')
      .populate('items.menuItem');

    res.status(201).json(booking);
  } catch (error) {
    console.error('Restaurant booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserRestaurantBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    const filter: any = { user: req.user!._id };
    if (type) filter.bookingType = type;

    const bookings = await RestaurantBooking.find(filter)
      .populate('tableId')
      .populate('items.menuItem')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await RestaurantBooking.countDocuments(filter);

    res.json({
      bookings,
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

export const getRestaurantBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await RestaurantBooking.findById(req.params.id)
      .populate('tableId')
      .populate('items.menuItem')
      .populate('user', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRestaurantBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    // Allow admin or staff with manageRestaurant permission
    if (req.user!.role !== 'admin' && !req.user!.permissions?.manageRestaurant) {
      return res.status(403).json({ message: 'Access denied. Management permission required.' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await RestaurantBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('tableId').populate('items.menuItem');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ message: 'Status updated successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addRatingAndFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, feedback } = req.body;
    
    const booking = await RestaurantBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed bookings' });
    }

    booking.rating = rating;
    booking.feedback = feedback;
    await booking.save();

    res.json({ message: 'Rating and feedback added successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin functions
export const getAllRestaurantBookings = async (req: AuthRequest, res: Response) => {
  try {
    // Allow admin or staff with viewRestaurant/manageRestaurant permission
    if (req.user!.role !== 'admin' && 
        !req.user!.permissions?.viewRestaurant && 
        !req.user!.permissions?.manageRestaurant) {
      return res.status(403).json({ message: 'Access denied. Required permissions not found.' });
    }

    const { page = 1, limit = 20, type, status } = req.query;
    
    const filter: any = {};
    if (type) filter.bookingType = type;
    if (status) filter.status = status;

    const bookings = await RestaurantBooking.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('tableId')
      .populate('items.menuItem')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await RestaurantBooking.countDocuments(filter);

    res.json({
      bookings,
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
