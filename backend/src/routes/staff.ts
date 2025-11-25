import express from 'express';
import {
  getStaffBookings,
  updateBookingStatusByStaff
} from '../controllers/staffController';
import { verifyToken, staffOnly, checkActiveStatus } from '../middleware/roleAuth';
import { requirePermission } from '../middleware/permissionAuth';

const router = express.Router();

// All staff routes require authentication, staff role, and active status
router.use(verifyToken);
router.use(checkActiveStatus);
router.use(staffOnly);

// Booking management - requires viewBookings permission
router.get('/bookings', requirePermission('viewBookings'), getStaffBookings);

// Update booking status - requires manageBookings permission
router.put('/bookings/:id/status', requirePermission('manageBookings'), updateBookingStatusByStaff);

export default router;
