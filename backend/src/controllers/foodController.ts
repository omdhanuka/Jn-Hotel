import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import MenuItem from '../models/MenuItem';
import Order from '../models/Order';
import { IUser } from '../models/User';
// import { sendOrderConfirmation } from '../utils/emailService';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getMenu = async (req: Request, res: Response) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    
    const filter: any = { isAvailable: true };
    
    if (category) filter.category = category;

    const menuItems = await MenuItem.find(filter)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ category: 1, name: 1 });

    const total = await MenuItem.countDocuments(filter);

    // Group by category
    const groupedMenu = menuItems.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({
      menuItems: groupedMenu,
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

export const getMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, orderType, tableId, roomNumber, specialRequests } = req.body;
    
    // Calculate total amount and prepare order items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `${menuItem.name} is currently unavailable` });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions
      });
    }

    // Create order
    const order = new Order({
      user: req.user!._id,
      items: orderItems,
      totalAmount,
      orderType,
      tableId,
      roomNumber,
      specialRequests
    });

    await order.save();

    // Populate the order with menu item details
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name price category')
      .populate('user', 'firstName lastName email');

    // Send order confirmation email
    // await sendOrderConfirmation(req.user!.email, {
    //   id: order.orderNumber,
    //   totalAmount: order.totalAmount,
    //   estimatedTime: order.estimatedTime
    // });

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter: any = { user: req.user!._id };
    
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('items.menuItem', 'name price category')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
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

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    // Check if user has permission (admin or staff)
    if (req.user!.role !== 'admin' && req.user!.role !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.menuItem', 'name price category');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const menuItem = new MenuItem(req.body);
    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
