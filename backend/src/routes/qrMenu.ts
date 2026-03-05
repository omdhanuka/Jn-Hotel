import { Router } from 'express';
import {
  getPublicMenu,
  getTableStatus,
  placeOrder,
  getOrderStatus,
} from '../controllers/qrMenuController';

const router = Router();

// Public routes – no authentication required
// GET  /api/qr/menu               – list available menu items
// GET  /api/qr/table/:tableNumber  – check if table exists & has active order
// POST /api/qr/order               – customer places an order
// GET  /api/qr/order/:orderId      – get order status (so customer can track)

router.get('/menu', getPublicMenu);
router.get('/table/:tableNumber', getTableStatus);
router.post('/order', placeOrder);
router.get('/order/:orderId', getOrderStatus);

export default router;
