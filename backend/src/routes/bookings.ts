import express from 'express';
import { body } from 'express-validator';
import { 
  createBooking, 
  getBookings, 
  getBookingById, 
  updateBooking, 
  cancelBooking,
  processPayment,
  updatePaymentStatus,
  cancelBookingByAdmin,
  getAllBookingsForAdmin,
  updateBookingByAdmin
} from '../controllers/bookingController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', auth, [
  body('type').isIn(['room', 'banquet', 'table', 'hotel']).withMessage('Invalid booking type'),
  body('resourceId').notEmpty().withMessage('Resource ID is required'),
  body('checkIn').isISO8601().withMessage('Check-in date is required'),
  body('checkOut').isISO8601().withMessage('Check-out date is required'),
  body('guests').isNumeric().withMessage('Number of guests is required')
], createBooking);

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', auth, getBookings);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, getBookingById);

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put('/:id', auth, updateBooking);

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking
// @access  Private
router.delete('/:id', auth, cancelBooking);

// @route   POST /api/bookings/:id/payment
// @desc    Process booking payment
// @access  Private
router.post('/:id/payment', auth, [
  body('paymentMethodId').notEmpty().withMessage('Payment method is required')
], processPayment);

// @route   PUT /api/bookings/:id/payment-status
// @desc    Update payment status (Admin only)
// @access  Private (Admin only)
router.put('/:id/payment-status', [auth, adminAuth], [
  body('paymentStatus').isIn(['pending', 'paid', 'refunded', 'cancelled', 'failed']).withMessage('Invalid payment status')
], updatePaymentStatus);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking by admin
// @access  Private (Admin only)
router.put('/:id/cancel', [auth, adminAuth], cancelBookingByAdmin);

// @route   GET /api/admin/bookings
// @desc    Get all bookings for admin
// @access  Private (Admin only)
router.get('/admin/bookings', [auth, adminAuth], getAllBookingsForAdmin);

// @route   PUT /api/bookings/:id
// @desc    Update booking by admin
// @access  Private (Admin only)
router.put('/:id', [auth, adminAuth], updateBookingByAdmin);

export default router;
