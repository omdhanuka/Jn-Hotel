import express from 'express';
import { body } from 'express-validator';
import { 
  createBooking, 
  getBookings, 
  getBookingById, 
  cancelBooking,
  processPayment,
  updatePaymentStatus,
  cancelBookingByAdmin,
  updateBookingByAdmin,
  getAllBookingsForAdmin,
  getBookingsForChart,
  updateBooking,
  updateBookingStatus
} from '../controllers/bookingController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Admin routes must come first to avoid conflicts with :id routes
// @route   GET /api/bookings/admin/chart
// @desc    Get bookings for chart visualization
// @access  Private (Admin only)
router.get('/admin/chart', [auth, adminAuth], getBookingsForChart);

// @route   GET /api/bookings/admin
// @desc    Get all bookings for admin
// @access  Private (Admin only)
router.get('/admin', [auth, adminAuth], getAllBookingsForAdmin);

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, getBookings);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, getBookingById);

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', [auth], [
  body('type').isIn(['room', 'banquet', 'table']).withMessage('Invalid booking type'),
  body('resourceId').notEmpty().withMessage('Resource ID is required'),
  body('checkIn').isISO8601().withMessage('Check-in date is required'),
  body('checkOut').isISO8601().withMessage('Check-out date is required'),
  body('guests').isNumeric().withMessage('Number of guests is required')
], createBooking);

// @route   PUT /api/bookings/:id
// @desc    Update booking by admin
// @access  Private (Admin only)
router.put('/:id', [auth, adminAuth], updateBookingByAdmin);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking by admin
// @access  Private (Admin only)
router.put('/:id/cancel', [auth, adminAuth], cancelBookingByAdmin);

// @route   PUT /api/bookings/:id/payment-status
// @desc    Update payment status (Admin only)
// @access  Private (Admin only)
router.put('/:id/payment-status', [auth, adminAuth], [
  body('paymentStatus').isIn(['pending', 'paid', 'refunded', 'cancelled', 'failed']).withMessage('Invalid payment status')
], updatePaymentStatus);

// @route   POST /api/bookings/:id/payment
// @desc    Process payment for booking
// @access  Private
router.post('/:id/payment', [auth], [
  body('paymentMethodId').notEmpty().withMessage('Payment method is required')
], processPayment);

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', [auth, adminAuth], [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid booking status')
], updateBookingStatus);

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking
// @access  Private
router.delete('/:id', auth, cancelBooking);

export default router;
