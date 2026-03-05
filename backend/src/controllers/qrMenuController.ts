import { Request, Response } from 'express';
import QRTable from '../models/QRTable';
import QROrder from '../models/QROrder';
import MenuItem from '../models/MenuItem';

// ─── GET MENU ITEMS (public, no auth) ────────────────────────────────────────
export const getPublicMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const filter: any = { isAvailable: true };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const items = await MenuItem.find(filter)
      .select('itemId name category description dishType price originalPrice discount isAvailable preparationTime images isFeatured calories')
      .sort({ isFeatured: -1, name: 1 });

    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu' });
  }
};

// ─── CHECK TABLE STATUS (public) ─────────────────────────────────────────────
export const getTableStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const num = parseInt(tableNumber);

    if (isNaN(num) || num < 1 || num > 50) {
      res.status(400).json({ success: false, message: 'Invalid table number' });
      return;
    }

    const table = await QRTable.findOne({ tableNumber: num });

    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    // Check if there is an active order for this table
    const activeOrder = await QROrder.findOne({ tableNumber: num, status: 'active' });

    res.json({
      success: true,
      table: {
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        capacity: table.capacity,
        status: table.status,
      },
      hasActiveOrder: !!activeOrder,
      activeOrderId: activeOrder?._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check table status' });
  }
};

// ─── PLACE ORDER (public) ─────────────────────────────────────────────────────
export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber, items, specialRequests } = req.body;

    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'tableNumber and items are required' });
      return;
    }

    const num = parseInt(String(tableNumber));
    const isQRTable = !isNaN(num) && num > 0;

    // Try to find a registered QR table (numeric IDs only)
    let qrTable = null;
    let resolvedTableName = `Table ${tableNumber}`;

    if (isQRTable) {
      qrTable = await QRTable.findOne({ tableNumber: num });
      if (qrTable) {
        resolvedTableName = qrTable.tableName;
        // Block if this QR table already has an active order
        const existingActiveOrder = await QROrder.findOne({ tableNumber: num, status: 'active' });
        if (existingActiveOrder) {
          res.status(409).json({
            success: false,
            message: 'This table already has an active session.',
            orderId: existingActiveOrder._id,
          });
          return;
        }
      }
    }

    // Validate items and compute total
    const validatedItems: any[] = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1) {
        res.status(400).json({ success: false, message: 'Invalid item in order' });
        return;
      }

      const menuItem = await MenuItem.findOne({ itemId: item.itemId, isAvailable: true });
      if (!menuItem) {
        res.status(400).json({ success: false, message: `Item "${item.name || item.itemId}" is not available` });
        return;
      }

      const lineTotal = menuItem.price * item.quantity;
      totalAmount += lineTotal;

      validatedItems.push({
        itemId: menuItem.itemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        dishType: menuItem.dishType,
        image: menuItem.images?.[0] || '',
      });
    }

    // Create the order — tableNumber stored as number for QR tables, string otherwise
    const order = await QROrder.create({
      tableNumber: isQRTable ? num : String(tableNumber),
      tableName: resolvedTableName,
      items: validatedItems,
      totalAmount,
      status: 'active',
      specialRequests: specialRequests || '',
    });

    // Update QRTable status only when a registered QR table was found
    if (qrTable) {
      await QRTable.findOneAndUpdate(
        { tableNumber: num },
        { status: 'occupied', currentOrderId: order._id }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Your food is being prepared.',
      orderId: order._id,
      tableNumber: isQRTable ? num : String(tableNumber),
      totalAmount,
    });
  } catch (error: any) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
};

// ─── GET ORDER STATUS (public – customer can poll) ────────────────────────────
export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await QROrder.findById(orderId).select('tableNumber tableName items totalAmount status specialRequests createdAt');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order status' });
  }
};
