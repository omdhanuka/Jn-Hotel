import { Request, Response } from 'express';
import RestaurantTable from '../models/RestaurantTable';
import RestaurantBooking from '../models/RestaurantBooking';
import MenuItem from '../models/MenuItem';
import Bill from '../models/Bill';
import User, { IUser } from '../models/User';
import TodaySpecial from '../models/TodaySpecial';

interface AuthRequest extends Request {
  user?: IUser;
}

// ===== DASHBOARD =====
export const getRestaurantDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalTables = await RestaurantTable.countDocuments();
    const availableTables = await RestaurantTable.countDocuments({ status: 'available' });
    const occupiedTables = await RestaurantTable.countDocuments({ status: 'reserved' });
    const cleaningTables = await RestaurantTable.countDocuments({ status: 'cleaning' });

    const todayOrders = await RestaurantBooking.countDocuments({
      deliveryType: 'dine-in',
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayRevenue = await RestaurantBooking.aggregate([
      {
        $match: {
          deliveryType: 'dine-in',
          paymentStatus: 'paid',
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalTables,
      availableTables,
      occupiedTables,
      cleaningTables,
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Restaurant dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== TABLE MANAGEMENT =====
export const getAllRestaurantTables = async (req: AuthRequest, res: Response) => {
  try {
    const tables = await RestaurantTable.find().sort({ tableName: 1 });

    const tablesWithDetails = await Promise.all(
      tables.map(async (table) => {
        const currentOrder = await RestaurantBooking.findOne({
          tableNumber: table.tableName,
          deliveryType: 'dine-in',
          status: { $in: ['pending', 'confirmed', 'preparing'] }
        }).populate('user', 'firstName lastName');

        let assignedWaiter = null;
        if (currentOrder && (currentOrder as any).assignedWaiter) {
          const waiter = await User.findById((currentOrder as any).assignedWaiter)
            .select('firstName lastName');
          assignedWaiter = waiter ? `${waiter.firstName} ${waiter.lastName}` : null;
        }

        return {
          ...table.toObject(),
          currentOrderId: currentOrder?._id,
          runningBill: currentOrder?.totalAmount || 0,
          assignedWaiter,
          guestName: currentOrder?.user ? 
            `${(currentOrder.user as any).firstName} ${(currentOrder.user as any).lastName}` : null
        };
      })
    );

    res.json({ tables: tablesWithDetails });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTableStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['available', 'reserved', 'cleaning', 'maintenance'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid table status' });
    }

    const table = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: `${req.user!.firstName} ${req.user!.lastName}` },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json({ message: 'Table status updated', table });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== WAITER ASSIGNMENT =====
export const assignWaiterToTable = async (req: AuthRequest, res: Response) => {
  try {
    console.log('assignWaiterToTable called with:', {
      tableId: req.params.id,
      waiterId: req.body.waiterId
    });

    const { waiterId } = req.body;
    const tableId = req.params.id;

    // Fetch staff members with Waiter or Chef department
    const waiter = await User.findOne({ 
      _id: waiterId, 
      role: { $in: ['staff', 'reception'] },
      department: { $in: ['Waiter', 'Chef', 'Food & Beverage'] },
      isActive: true
    });

    if (!waiter) {
      console.log('Waiter not found:', waiterId);
      return res.status(404).json({ message: 'Waiter not found or not eligible' });
    }

    const table = await RestaurantTable.findById(tableId);
    if (!table) {
      console.log('Table not found:', tableId);
      return res.status(404).json({ message: 'Table not found' });
    }

    // Find active order for this table
    const order = await RestaurantBooking.findOne({
      tableNumber: table.tableName,
      deliveryType: 'dine-in',
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    if (order) {
      (order as any).assignedWaiter = waiterId;
      await order.save();
      console.log('Waiter assigned to order:', order._id);
    } else {
      console.log('No active order found for table:', table.tableName);
    }

    console.log('Waiter assigned successfully');
    res.json({ 
      message: `Waiter ${waiter.firstName} ${waiter.lastName} assigned to ${table.tableName}`,
      waiter: { 
        id: waiter._id, 
        name: `${waiter.firstName} ${waiter.lastName}` 
      }
    });
  } catch (error) {
    console.error('Assign waiter error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const removeWaiterFromTable = async (req: AuthRequest, res: Response) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const order = await RestaurantBooking.findOne({
      tableNumber: table.tableName,
      deliveryType: 'dine-in',
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    if (order) {
      (order as any).assignedWaiter = undefined;
      await order.save();
    }

    res.json({ message: 'Waiter removed from table' });
  } catch (error) {
    console.error('Remove waiter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignWaiterToOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { waiterId } = req.body;
    
    const waiter = await User.findOne({ 
      _id: waiterId, 
      role: 'staff',
      permissions: { viewOrders: true }
    });

    if (!waiter) {
      return res.status(404).json({ message: 'Waiter not found' });
    }

    const order = await RestaurantBooking.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    (order as any).assignedWaiter = waiterId;
    await order.save();

    res.json({ 
      message: 'Waiter assigned to order',
      waiter: { id: waiter._id, name: `${waiter.firstName} ${waiter.lastName}` }
    });
  } catch (error) {
    console.error('Assign waiter to order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== ORDER MANAGEMENT =====
export const getDineInOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, tableNumber } = req.query;

    const filter: any = { deliveryType: 'dine-in' };
    if (status && status !== 'all') filter.status = status;
    if (tableNumber) filter.tableNumber = tableNumber;

    const orders = await RestaurantBooking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    // Get all orders that already have bills generated
    const orderIds = orders.map(o => o._id);
    const existingBills = await Bill.find({
      orderId: { $in: orderIds },
      deliveryType: 'dine-in'
    }).select('orderId');

    // Create a Set of order IDs that have bills
    const billGeneratedOrderIds = new Set(
      existingBills.map(bill => bill.orderId.toString())
    );

    // Filter out orders that already have bills
    const ordersWithoutBills = orders.filter(
      order => !billGeneratedOrderIds.has(order._id.toString())
    );

    const ordersWithWaiter = await Promise.all(
      ordersWithoutBills.map(async (order) => {
        let waiterName = null;
        if ((order as any).assignedWaiter) {
          const waiter = await User.findById((order as any).assignedWaiter)
            .select('firstName lastName');
          waiterName = waiter ? `${waiter.firstName} ${waiter.lastName}` : null;
        }

        return {
          ...order.toObject(),
          assignedWaiterName: waiterName
        };
      })
    );

    res.json({ orders: ordersWithWaiter });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDineInOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { tableNumber, items, specialRequests, assignedWaiter } = req.body;

    if (!tableNumber || !items || items.length === 0) {
      return res.status(400).json({ message: 'Table number and items are required' });
    }

    const table = await RestaurantTable.findOne({ tableName: tableNumber });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.name} not found` });
      }
      totalAmount += menuItem.price * item.quantity;
    }

    const orderCount = await RestaurantBooking.countDocuments();
    const bookingId = `DINE${String(orderCount + 1).padStart(4, '0')}`;

    const order = new RestaurantBooking({
      user: req.user!._id,
      bookingId,
      bookingType: 'order',
      fullName: `${req.user!.firstName} ${req.user!.lastName}`,
      email: req.user!.email,
      phone: req.user!.phone || '',
      tableNumber,
      items,
      totalAmount,
      deliveryType: 'dine-in',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'confirmed',
      specialRequests,
      assignedWaiter
    });

    await order.save();

    // Update table status
    table.status = 'reserved';
    await table.save();

    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const order = await RestaurantBooking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let waiterName = null;
    if ((order as any).assignedWaiter) {
      const waiter = await User.findById((order as any).assignedWaiter)
        .select('firstName lastName');
      waiterName = waiter ? `${waiter.firstName} ${waiter.lastName}` : null;
    }

    res.json({ 
      order: {
        ...order.toObject(),
        assignedWaiterName: waiterName
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderItems = async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;

    const order = await RestaurantBooking.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Recalculate total
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        totalAmount += menuItem.price * item.quantity;
      }
    }

    order.items = items;
    order.totalAmount = totalAmount;
    await order.save();

    res.json({ message: 'Order updated', order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await RestaurantBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await RestaurantBooking.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'cancelled';
    await order.save();

    // Free up table
    if (order.tableNumber) {
      await RestaurantTable.findOneAndUpdate(
        { tableName: order.tableNumber },
        { status: 'available' }
      );
    }

    res.json({ message: 'Order cancelled' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== KITCHEN DISPLAY =====
export const getKitchenOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await RestaurantBooking.find({
      deliveryType: 'dine-in',
      status: { $in: ['confirmed', 'preparing'] }
    })
      .populate('items.menuItem')
      .sort({ createdAt: 1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get kitchen orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateKitchenStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'ready'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid kitchen status' });
    }

    const order = await RestaurantBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Kitchen status updated', order });
  } catch (error) {
    console.error('Update kitchen status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== BILLING =====
export const generateBill = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, discount, notes } = req.body;

    // Find the dine-in order
    const order = await RestaurantBooking.findById(orderId)
      .populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow dine-in orders
    if (order.deliveryType !== 'dine-in') {
      return res.status(400).json({ message: 'Only dine-in orders can generate bills here' });
    }

    if (!order.tableNumber) {
      return res.status(400).json({ message: 'Table number is required for dine-in bills' });
    }

    // Check if bill already exists - IMPORTANT
    const existingBill = await Bill.findOne({ 
      orderId: order._id,
      deliveryType: 'dine-in'
    });
    
    if (existingBill) {
      return res.status(400).json({ 
        message: 'Bill already generated for this order',
        bill: existingBill 
      });
    }

    // Calculate bill amounts
    const subtotal = order.totalAmount;
    const discountAmount = discount || 0;
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.05; // 5% tax
    const serviceCharge = afterDiscount * 0.10; // 10% service charge
    const totalAmount = afterDiscount + tax + serviceCharge;

    // Generate bill number
    const billCount = await Bill.countDocuments();
    const billNumber = `BILL-${new Date().getFullYear()}-${String(billCount + 1).padStart(5, '0')}`;

    // Create bill with correct generatedBy (user ID) and billType
    const bill = new Bill({
      billNumber,
      billType: 'restaurant', // Add required billType field
      orderId: order._id,
      tableNumber: order.tableNumber,
      customerName: order.fullName,
      customerPhone: order.phone,
      items: order.items,
      subtotal,
      discount: discountAmount,
      tax,
      serviceCharge,
      totalAmount,
      paymentMethod: 'cash', // Default for dine-in
      paymentStatus: 'pending',
      deliveryType: 'dine-in',
      notes,
      generatedBy: req.user!._id, // Use user ObjectId, not name string
      generatedAt: new Date()
    });

    await bill.save();

    // Update order status
    order.paymentStatus = 'pending';
    order.status = 'completed';
    await order.save();

    // Update table status to reserved (bill pending)
    await RestaurantTable.findOneAndUpdate(
      { tableName: order.tableNumber },
      { status: 'reserved' }
    );

    res.status(201).json({ 
      message: 'Bill generated successfully',
      bill 
    });
  } catch (error) {
    console.error('Generate bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const generateBillForTable = async (req: AuthRequest, res: Response) => {
  try {
    const { tableNumber, discount, notes } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number is required' });
    }

    // Find pending dine-in order for this table
    const order = await RestaurantBooking.findOne({
      deliveryType: 'dine-in',
      tableNumber,
      status: { $in: ['confirmed', 'preparing', 'ready'] },
      paymentStatus: 'pending'
    }).populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({ 
        message: 'No active order found for this table' 
      });
    }

    // Check if bill already exists for this order - IMPORTANT
    const existingBill = await Bill.findOne({ 
      orderId: order._id,
      deliveryType: 'dine-in' 
    });
    
    if (existingBill) {
      return res.status(400).json({ 
        message: 'Bill already generated for this table',
        bill: existingBill 
      });
    }

    // Calculate bill amounts
    const subtotal = order.totalAmount;
    const discountAmount = discount || 0;
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.05; // 5% tax
    const serviceCharge = afterDiscount * 0.10; // 10% service charge
    const totalAmount = afterDiscount + tax + serviceCharge;

    // Generate bill number
    const billCount = await Bill.countDocuments();
    const billNumber = `BILL-${new Date().getFullYear()}-${String(billCount + 1).padStart(5, '0')}`;

    // Create bill with correct generatedBy (user ID) and billType
    const bill = new Bill({
      billNumber,
      billType: 'restaurant', // Add required billType field
      orderId: order._id,
      tableNumber: order.tableNumber,
      customerName: order.fullName,
      customerPhone: order.phone,
      items: order.items,
      subtotal,
      discount: discountAmount,
      tax,
      serviceCharge,
      totalAmount,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      deliveryType: 'dine-in',
      notes,
      generatedBy: req.user!._id, // Use user ObjectId, not name string
      generatedAt: new Date()
    });

    await bill.save();

    // Update order
    order.status = 'completed';
    await order.save();

    res.status(201).json({ 
      message: 'Bill generated successfully',
      bill 
    });
  } catch (error) {
    console.error('Generate bill for table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBills = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, status, tableNumber } = req.query;

    // Only fetch dine-in bills
    const filter: any = { deliveryType: 'dine-in' };
    
    if (status && status !== 'all') {
      filter.paymentStatus = status;
    }
    
    if (tableNumber) {
      filter.tableNumber = tableNumber;
    }

    const bills = await Bill.find(filter)
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    // Get counts for dashboard
    const counts = {
      total: bills.length,
      pending: bills.filter(b => b.paymentStatus === 'pending').length,
      paid: bills.filter(b => b.paymentStatus === 'paid').length
    };

    res.json({ 
      bills,
      counts
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBillsByTable = async (req: AuthRequest, res: Response) => {
  try {
    const { tableNumber } = req.params;

    const bills = await Bill.find({
      tableNumber,
      deliveryType: 'dine-in'
    })
      .sort({ generatedAt: -1 })
      .lean();

    // Get pending bill if exists
    const pendingBill = bills.find(b => b.paymentStatus === 'pending');

    res.json({ 
      bills,
      pendingBill,
      hasPendingBill: !!pendingBill
    });
  } catch (error) {
    console.error('Get bills by table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBillById = async (req: AuthRequest, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id).lean();

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Only return dine-in bills
    if (bill.deliveryType !== 'dine-in') {
      return res.status(400).json({ message: 'Not a dine-in bill' });
    }

    res.json({ bill });
  } catch (error) {
    console.error('Get bill by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markBillAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentMethod } = req.body;

    const bill = await Bill.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.deliveryType !== 'dine-in') {
      return res.status(400).json({ message: 'Not a dine-in bill' });
    }

    if (bill.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Bill already paid' });
    }

    // Update bill
    bill.paymentStatus = 'paid';
    bill.paymentMethod = paymentMethod || bill.paymentMethod;
    await bill.save();

    // Update order
    await RestaurantBooking.findByIdAndUpdate(bill.orderId, {
      paymentStatus: 'paid',
      status: 'completed'
    });

    // Free up the table
    await RestaurantTable.findOneAndUpdate(
      { tableName: bill.tableNumber },
      { status: 'cleaning' } // Mark for cleaning after payment
    );

    res.json({ 
      message: 'Bill marked as paid',
      bill 
    });
  } catch (error) {
    console.error('Mark bill as paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== REPORTS =====
export const getRestaurantReports = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'day' } = req.query;
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const totalOrders = await RestaurantBooking.countDocuments({
      deliveryType: 'dine-in',
      createdAt: { $gte: startDate }
    });

    const revenue = await RestaurantBooking.aggregate([
      {
        $match: {
          deliveryType: 'dine-in',
          paymentStatus: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const popularDishes = await RestaurantBooking.aggregate([
      {
        $match: {
          deliveryType: 'dine-in',
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const tableUsage = await RestaurantBooking.aggregate([
      {
        $match: {
          deliveryType: 'dine-in',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$tableNumber',
          orders: { $sum: 1 }
        }
      },
      { $sort: { orders: -1 } }
    ]);

    res.json({
      period,
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
      popularDishes,
      tableUsage
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== WAITER MANAGEMENT =====
export const getWaiters = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch staff members with Waiter or Chef department
    const waiters = await User.find({
      role: { $in: ['staff', 'reception'] },
      department: { $in: ['Waiter', 'Chef', 'Food & Beverage'] },
      isActive: true
    })
      .select('firstName lastName email department position')
      .sort({ firstName: 1 });

    console.log(`Found ${waiters.length} waiters/chefs`);

    res.json({ 
      waiters,
      count: waiters.length 
    });
  } catch (error) {
    console.error('Get waiters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllMenuItems = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search, available } = req.query;
    
    const filter: any = {};
    if (category && category !== 'all') filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';
    
    let menuItems = await MenuItem.find(filter)
      .sort({ category: 1, name: 1 });

    // Apply search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      menuItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    }

    res.json({ menuItems });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMenuItemAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { isAvailable } = req.body;

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { 
        isAvailable,
        updatedBy: `${req.user!.firstName} ${req.user!.lastName}`
      },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    console.log(`📋 Menu item ${menuItem.name} marked as ${isAvailable ? 'available' : 'out of stock'} by ${req.user!.firstName} ${req.user!.lastName}`);

    res.json({
      message: `${menuItem.name} ${isAvailable ? 'is now available' : 'marked as out of stock'}`,
      menuItem
    });
  } catch (error) {
    console.error('Update menu availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMenuItemStock = async (req: AuthRequest, res: Response) => {
  try {
    const { stockQuantity, isAvailable } = req.body;

    const updateData: any = {
      updatedBy: `${req.user!.firstName} ${req.user!.lastName}`
    };

    if (stockQuantity !== undefined) {
      updateData.stockQuantity = stockQuantity;
      // Auto-mark as unavailable if stock is 0
      if (stockQuantity === 0) {
        updateData.isAvailable = false;
      }
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    console.log(`📦 Stock updated for ${menuItem.name}: ${stockQuantity} units, Available: ${menuItem.isAvailable}`);

    res.json({
      message: 'Stock updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update menu stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Get today's special items (separate from regular menu)
export const getTodaySpecials = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    
    const specials = await TodaySpecial.find({ 
      validUntil: { $gte: now },
      isAvailable: true 
    }).sort({ createdAt: -1 });

    res.json({ specials, count: specials.length });
  } catch (error) {
    console.error('Get today specials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Create today's special item
export const createTodaySpecial = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      name, description, category, dishType, price, originalPrice,
      images, preparationTime, spiceLevels, addOns, stockQuantity 
    } = req.body;

    // Set valid until end of today
    const validUntil = new Date();
    validUntil.setHours(23, 59, 59, 999);

    const special = new TodaySpecial({
      name,
      description,
      category,
      dishType,
      price,
      originalPrice,
      images: images || [],
      preparationTime,
      spiceLevels: spiceLevels || [],
      addOns: addOns || [],
      stockQuantity,
      isAvailable: true,
      validUntil,
      createdBy: `${req.user!.firstName} ${req.user!.lastName}`
    });

    await special.save();

    console.log(`🌟 Today's special created: ${name} by ${req.user!.firstName} ${req.user!.lastName}`);

    res.status(201).json({
      message: 'Today\'s special item created successfully',
      special
    });
  } catch (error) {
    console.error('Create today special error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Update today's special
export const updateTodaySpecial = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      name, description, price, originalPrice, stockQuantity, 
      isAvailable, images, addOns 
    } = req.body;

    const special = await TodaySpecial.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        originalPrice,
        stockQuantity,
        isAvailable,
        images,
        addOns
      },
      { new: true }
    );

    if (!special) {
      return res.status(404).json({ message: 'Today\'s special not found' });
    }

    res.json({
      message: 'Today\'s special updated',
      special
    });
  } catch (error) {
    console.error('Update today special error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Delete today's special
export const deleteTodaySpecial = async (req: AuthRequest, res: Response) => {
  try {
    const special = await TodaySpecial.findByIdAndDelete(req.params.id);

    if (!special) {
      return res.status(404).json({ message: 'Today\'s special not found' });
    }

    console.log(`🗑️ Today's special deleted: ${special.name}`);

    res.json({ message: 'Today\'s special removed' });
  } catch (error) {
    console.error('Delete today special error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Update stock for today's special
export const updateTodaySpecialStock = async (req: AuthRequest, res: Response) => {
  try {
    const { stockQuantity } = req.body;

    const special = await TodaySpecial.findByIdAndUpdate(
      req.params.id,
      { 
        stockQuantity,
        isAvailable: stockQuantity > 0
      },
      { new: true }
    );

    if (!special) {
      return res.status(404).json({ message: 'Today\'s special not found' });
    }

    res.json({
      message: 'Stock updated',
      special
    });
  } catch (error) {
    console.error('Update special stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
