import { Request, Response } from 'express';
import QRTable from '../models/QRTable';
import QROrder from '../models/QROrder';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── SEED TABLES 1–20 (admin, one-time setup) ────────────────────────────────
export const seedTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count = 20 } = req.body;
    const tableCount = Math.min(Math.max(parseInt(String(count)), 1), 50);

    const created: number[] = [];
    const existing: number[] = [];

    for (let i = 1; i <= tableCount; i++) {
      const exists = await QRTable.findOne({ tableNumber: i });
      if (exists) {
        existing.push(i);
        continue;
      }

      await QRTable.create({
        tableNumber: i,
        tableName: `Table ${i}`,
        capacity: i <= 4 ? 2 : i <= 12 ? 4 : 6,
        qrCodeUrl: `${CLIENT_URL}/menu?table=${i}`,
        status: 'empty',
      });
      created.push(i);
    }

    res.json({
      success: true,
      message: `Setup complete. Created: ${created.length}, Already existed: ${existing.length}`,
      created,
      existing,
    });
  } catch (error: any) {
    console.error('Seed tables error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed tables' });
  }
};

// ─── GET ALL TABLES WITH STATUS ───────────────────────────────────────────────
export const getAllTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const tables = await QRTable.find().sort({ tableNumber: 1 });

    // For each occupied table, fetch its active order summary
    const tablesWithOrders = await Promise.all(
      tables.map(async (table) => {
        let activeOrder = null;
        if (table.status === 'occupied') {
          activeOrder = await QROrder.findOne({ tableNumber: table.tableNumber, status: 'active' })
            .select('_id items totalAmount createdAt specialRequests');
        }
        return {
          _id: table._id,
          tableNumber: table.tableNumber,
          tableName: table.tableName,
          capacity: table.capacity,
          qrCodeUrl: table.qrCodeUrl,
          status: table.status,
          activeOrder,
        };
      })
    );

    res.json({ success: true, tables: tablesWithOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tables' });
  }
};

// ─── GET SINGLE TABLE DETAIL + ACTIVE ORDER ────────────────────────────────────
export const getTableDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const num = parseInt(tableNumber);

    const table = await QRTable.findOne({ tableNumber: num });
    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    const activeOrder = await QROrder.findOne({ tableNumber: num, status: 'active' });

    res.json({ success: true, table, activeOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch table details' });
  }
};

// ─── GET ALL ACTIVE ORDERS ───────────────────────────────────────────────────
export const getAllActiveOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await QROrder.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active orders' });
  }
};

// ─── GENERATE BILL → complete order + free table ─────────────────────────────
export const generateBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const num = parseInt(tableNumber);

    const table = await QRTable.findOne({ tableNumber: num });
    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    const activeOrder = await QROrder.findOne({ tableNumber: num, status: 'active' });
    if (!activeOrder) {
      res.status(404).json({ success: false, message: 'No active order found for this table' });
      return;
    }

    // Mark order as completed
    activeOrder.status = 'completed';
    activeOrder.completedAt = new Date();
    await activeOrder.save();

    // Free the table
    await QRTable.findOneAndUpdate(
      { tableNumber: num },
      { status: 'empty', currentOrderId: null }
    );

    res.json({
      success: true,
      message: `Bill generated for ${table.tableName}. Table is now free.`,
      order: {
        _id: activeOrder._id,
        tableNumber: activeOrder.tableNumber,
        tableName: activeOrder.tableName,
        items: activeOrder.items,
        totalAmount: activeOrder.totalAmount,
        completedAt: activeOrder.completedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate bill' });
  }
};

// ─── CANCEL ORDER ────────────────────────────────────────────────────────────
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const num = parseInt(tableNumber);

    const activeOrder = await QROrder.findOne({ tableNumber: num, status: 'active' });
    if (!activeOrder) {
      res.status(404).json({ success: false, message: 'No active order found for this table' });
      return;
    }

    activeOrder.status = 'cancelled';
    await activeOrder.save();

    await QRTable.findOneAndUpdate(
      { tableNumber: num },
      { status: 'empty', currentOrderId: null }
    );

    res.json({ success: true, message: 'Order cancelled and table freed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

// ─── GET ORDER HISTORY (all completed orders) ─────────────────────────────────
export const getOrderHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '20'));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      QROrder.find({ status: { $in: ['completed', 'cancelled'] } })
        .sort({ completedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QROrder.countDocuments({ status: { $in: ['completed', 'cancelled'] } }),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order history' });
  }
};

// ─── UPDATE QR ORDER STATUS BY ID ────────────────────────────────────────────
export const updateQROrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    // Map frontend display statuses → QROrder enum values
    const qrStatus =
      status === 'completed' ? 'completed' :
      status === 'cancelled' ? 'cancelled' :
      'active';

    const updatePayload: Record<string, unknown> = { status: qrStatus };
    if (qrStatus === 'completed' || qrStatus === 'cancelled') {
      updatePayload.completedAt = new Date();
    }

    const order = await QROrder.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ success: false, message: 'QR order not found' });
      return;
    }

    // Free the table when order finishes
    if (qrStatus === 'completed' || qrStatus === 'cancelled') {
      await QRTable.findOneAndUpdate(
        { tableNumber: order.tableNumber },
        { $set: { status: 'empty', currentOrderId: null } }
      );
    }

    res.json({ success: true, message: 'Status updated', order });
  } catch (err) {
    console.error('updateQROrderStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update QR order status' });
  }
};

// ─── DELETE TABLE (admin utility) ────────────────────────────────────────────
export const deleteTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const num = parseInt(tableNumber);

    const table = await QRTable.findOne({ tableNumber: num });
    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    if (table.status === 'occupied') {
      res.status(400).json({ success: false, message: 'Cannot delete an occupied table' });
      return;
    }

    await QRTable.deleteOne({ tableNumber: num });
    res.json({ success: true, message: `Table ${num} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete table' });
  }
};
