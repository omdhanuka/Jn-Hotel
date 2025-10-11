import express from 'express';
import { body } from 'express-validator';
import { 
  getMenuItems, 
  getMenuItemById, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getRestaurantTables,
  getRestaurantTableById,
  createRestaurantTable,
  updateRestaurantTable,
  deleteRestaurantTable,
  getMenuCategories
} from '../controllers/restaurantController';
import { 
  createRestaurantBooking,
  getUserRestaurantBookings,
  getRestaurantBookingById,
  updateRestaurantBookingStatus,
  addRatingAndFeedback,
  getAllRestaurantBookings
} from '../controllers/restaurantBookingController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { createBill, getBills, getBillById } from '../controllers/billController';

const router = express.Router();

// Menu Item Routes
// @route   GET /api/restaurant/menu
// @desc    Get all menu items
// @access  Public
router.get('/menu', getMenuItems);

// @route   GET /api/restaurant/menu/categories
// @desc    Get all menu categories
// @access  Public
router.get('/menu/categories', getMenuCategories);

// @route   GET /api/restaurant/menu/:id
// @desc    Get menu item by ID
// @access  Public
router.get('/menu/:id', getMenuItemById);

// @route   POST /api/restaurant/menu
// @desc    Create new menu item
// @access  Private (Admin only)
router.post('/menu', [auth, adminAuth], [
  body('name').notEmpty().withMessage('Item name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('dishType').isIn(['veg', 'non-veg', 'vegan']).withMessage('Invalid dish type'),
  body('price').isNumeric().withMessage('Price must be a number')
], createMenuItem);

// @route   PUT /api/restaurant/menu/:id
// @desc    Update menu item
// @access  Private (Admin only)
router.put('/menu/:id', [auth, adminAuth], updateMenuItem);

// @route   DELETE /api/restaurant/menu/:id
// @desc    Delete menu item
// @access  Private (Admin only)
router.delete('/menu/:id', [auth, adminAuth], deleteMenuItem);

// Restaurant Table Routes
// @route   GET /api/restaurant/tables
// @desc    Get all restaurant tables
// @access  Public
router.get('/tables', getRestaurantTables);

// @route   GET /api/restaurant/tables/:id
// @desc    Get table by ID
// @access  Public
router.get('/tables/:id', getRestaurantTableById);

// @route   POST /api/restaurant/tables
// @desc    Create new table
// @access  Private (Admin only)
router.post('/tables', [auth, adminAuth], [
  body('tableName').notEmpty().withMessage('Table name is required'),
  body('seatingCapacity').isNumeric().withMessage('Seating capacity must be a number'),
  body('tableType').isIn(['indoor', 'outdoor', 'rooftop', 'private']).withMessage('Invalid table type')
], createRestaurantTable);

// @route   PUT /api/restaurant/tables/:id
// @desc    Update table
// @access  Private (Admin only)
router.put('/tables/:id', [auth, adminAuth], updateRestaurantTable);

// @route   DELETE /api/restaurant/tables/:id
// @desc    Delete table
// @access  Private (Admin only)
router.delete('/tables/:id', [auth, adminAuth], deleteRestaurantTable);

// Restaurant Booking Routes
// @route   POST /api/restaurant/bookings
// @desc    Create new restaurant booking or order
// @access  Private
router.post('/bookings', [auth], [
  body('bookingType').isIn(['table', 'order']).withMessage('Invalid booking type'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
], createRestaurantBooking);

// @route   GET /api/restaurant/bookings
// @desc    Get user's restaurant bookings
// @access  Private
router.get('/bookings', auth, getUserRestaurantBookings);

// @route   GET /api/restaurant/bookings/admin
// @desc    Get all restaurant bookings (Admin)
// @access  Private (Admin only)
router.get('/bookings/admin', [auth, adminAuth], getAllRestaurantBookings);

// @route   GET /api/restaurant/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/bookings/:id', auth, getRestaurantBookingById);

// @route   PUT /api/restaurant/bookings/:id/status
// @desc    Update booking status
// @access  Private (Admin only)
router.put('/bookings/:id/status', [auth, adminAuth], updateRestaurantBookingStatus);

// @route   PUT /api/restaurant/bookings/:id/rating
// @desc    Add rating and feedback
// @access  Private
router.put('/bookings/:id/rating', [auth], [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], addRatingAndFeedback);

// Bill Routes
// @route   POST /api/restaurant/bills
// @desc    Create new bill
// @access  Private (Admin only)
router.post('/bills', [auth, adminAuth], createBill);

// @route   GET /api/restaurant/bills
// @desc    Get all bills
// @access  Private (Admin only)
router.get('/bills', [auth, adminAuth], getBills);

// @route   GET /api/restaurant/bills/:id
// @desc    Get bill by ID
// @access  Private (Admin only)
router.get('/bills/:id', [auth, adminAuth], getBillById);

export default router;
