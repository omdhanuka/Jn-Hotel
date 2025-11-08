import express from 'express';
import { 
  getDashboardStats, 
  getAllBookings, 
  getAllUsers, 
  updateUserRole,
  getRevenue,
  getOccupancyRate,
  getAllReviews 
} from '../controllers/adminController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(auth, adminAuth);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', getDashboardStats);

// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Private (Admin only)
router.get('/bookings', getAllBookings);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', getAllUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', updateUserRole);

// @route   GET /api/admin/revenue
// @desc    Get revenue statistics
// @access  Private (Admin only)
router.get('/revenue', getRevenue);

// @route   GET /api/admin/occupancy
// @desc    Get occupancy rate
// @access  Private (Admin only)
router.get('/occupancy', getOccupancyRate);

// @route   GET /api/admin/reviews
// @desc    Get all reviews
// @access  Private (Admin only)
router.get('/reviews', getAllReviews);

export default router;
