import express from 'express';
import { 
  getDashboardStats, 
  getAllBookings, 
  getAllUsers, 
  updateUserRole,
  getRevenue,
  getOccupancyRate,
  getAllReviews,
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  getUserPermissions
} from '../controllers/adminController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(auth, adminAuth);

// Dashboard & Stats
router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenue);
router.get('/occupancy', getOccupancyRate);

// Bookings Management
router.get('/bookings', getAllBookings);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/users/:id/permissions', getUserPermissions); // IMPORTANT: This route must be registered

// Reviews Management
router.get('/reviews', getAllReviews);

// Staff Management
router.get('/staff', getAllStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);
router.put('/staff/:id/status', updateStaffStatus);

console.log('✅ Admin routes configured with permissions endpoint');

export default router;
