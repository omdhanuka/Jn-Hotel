import { Router } from 'express';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import {
  seedTables,
  getAllTables,
  getTableDetail,
  getAllActiveOrders,
  generateBill,
  cancelOrder,
  getOrderHistory,
  deleteTable,
  updateQROrderStatus,
} from '../controllers/qrAdminController';

const router = Router();

// All routes here require admin authentication
// Usage: [auth, adminAuth] middleware chain

// POST  /api/qr/admin/setup           – seed tables 1–N (one-time)
// GET   /api/qr/admin/tables          – all tables + active order summary
// GET   /api/qr/admin/tables/:tn      – single table detail
// GET   /api/qr/admin/orders/active   – all active orders across all tables
// GET   /api/qr/admin/orders/history  – completed/cancelled orders (paginated)
// POST  /api/qr/admin/bill/:tn        – generate bill → complete order + free table
// POST  /api/qr/admin/cancel/:tn      – cancel active order + free table
// DELETE /api/qr/admin/tables/:tn     – delete a table (must be empty)

router.post('/setup', auth, adminAuth, seedTables);
router.get('/tables', auth, adminAuth, getAllTables);
router.get('/tables/:tableNumber', auth, adminAuth, getTableDetail);
router.get('/orders/active', auth, adminAuth, getAllActiveOrders);
router.get('/orders/history', auth, adminAuth, getOrderHistory);
router.put('/orders/:id/status', auth, adminAuth, updateQROrderStatus);
router.post('/bill/:tableNumber', auth, adminAuth, generateBill);
router.post('/cancel/:tableNumber', auth, adminAuth, cancelOrder);
router.delete('/tables/:tableNumber', auth, adminAuth, deleteTable);

export default router;
