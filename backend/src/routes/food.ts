import express from 'express';
import { body } from 'express-validator';
import { 
  getMenu, 
  getMenuItem, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  placeOrder,
  getOrders,
  updateOrderStatus 
} from '../controllers/foodController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// @route   GET /api/food/menu
// @desc    Get menu items
// @access  Public
router.get('/menu', getMenu);

// @route   GET /api/food/menu/:id
// @desc    Get menu item by ID
// @access  Public
router.get('/menu/:id', getMenuItem);

// @route   POST /api/food/order
// @desc    Place food order
// @access  Private
router.post('/order', auth, [
  body('items').isArray().withMessage('Order items are required'),
  body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
  body('items.*.quantity').isNumeric().withMessage('Quantity must be a number')
], placeOrder);

// @route   GET /api/food/orders
// @desc    Get user orders
// @access  Private
router.get('/orders', auth, getOrders);

// @route   PUT /api/food/orders/:id/status
// @desc    Update order status
// @access  Private (Admin/Staff only)
router.put('/orders/:id/status', [auth], [
  body('status').isIn(['pending', 'preparing', 'ready', 'delivered', 'cancelled']).withMessage('Invalid status')
], updateOrderStatus);

// @route   POST /api/food/menu
// @desc    Create menu item
// @access  Private (Admin only)
router.post('/menu', [auth, adminAuth], [
  body('name').notEmpty().withMessage('Item name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required')
], createMenuItem);

// @route   PUT /api/food/menu/:id
// @desc    Update menu item
// @access  Private (Admin only)
router.put('/menu/:id', [auth, adminAuth], updateMenuItem);

// @route   DELETE /api/food/menu/:id
// @desc    Delete menu item
// @access  Private (Admin only)
router.delete('/menu/:id', [auth, adminAuth], deleteMenuItem);

export default router;
