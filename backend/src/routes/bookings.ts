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
  updateBookingStatus,
  getBookingStats,
  createBookingComplaint,
  createBookingByAdmin
} from '../controllers/bookingController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import Booking from '../models/Booking';

const router = express.Router();

// Admin routes must come first to avoid conflicts with :id routes
// @route   GET /api/bookings/stats
// @desc    Get booking statistics for dashboard
// @access  Private (Admin only)
router.get('/stats', [auth, adminAuth], getBookingStats);

// @route   GET /api/bookings/admin/chart
// @desc    Get bookings for chart visualization
// @access  Private (Admin only)
router.get('/admin/chart', [auth, adminAuth], getBookingsForChart);

// @route   GET /api/bookings/admin
// @desc    Get all bookings for admin
// @access  Private (Admin only)
router.get('/admin', [auth, adminAuth], getAllBookingsForAdmin);

// @route   POST /api/bookings/admin/create
// @desc    Create a booking manually (Admin only)
// @access  Private (Admin only)
router.post('/admin/create', [auth, adminAuth], [
  body('email').isEmail().withMessage('Valid email is required'),
  body('type').isIn(['room', 'banquet', 'table']).withMessage('Invalid booking type'),
  body('checkIn').isISO8601().withMessage('Check-in date is required'),
  body('checkOut').isISO8601().withMessage('Check-out date is required'),
  body('guests').optional().isNumeric().withMessage('Number of guests must be numeric')
], createBookingByAdmin);

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, getBookings);

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

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', [auth, adminAuth], [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid booking status')
], updateBookingStatus);

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

// @route   POST /api/bookings/:id/payment
// @desc    Process payment for booking
// @access  Private
router.post('/:id/payment', [auth], [
  body('paymentMethodId').notEmpty().withMessage('Payment method is required')
], processPayment);

// @route   POST /api/bookings/:id/complaint
// @desc    Create complaint for booking (only during check-in to check-out period)
// @access  Private
router.post('/:id/complaint', [auth], [
  body('category').notEmpty().withMessage('Category is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], createBookingComplaint);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, getBookingById);

// @route   PUT /api/bookings/:id
// @desc    Update booking (including bill) - Admin or booking owner
// @access  Private
router.put('/:id', auth, [
  body('checkIn').optional().isISO8601().withMessage('Invalid check-in date'),
  body('checkOut').optional().isISO8601().withMessage('Invalid check-out date'),
  body('guests').optional().isNumeric().withMessage('Guests must be a number'),
  body('bill.items').optional().isArray().withMessage('Bill items must be an array'),
  body('bill.grandTotal').optional().isNumeric().withMessage('Grand total must be a number')
], async (req: any, res: express.Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking
// @access  Private
router.delete('/:id', auth, cancelBooking);

export default router;
