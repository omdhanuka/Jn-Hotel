import express from 'express';
import {
  getReceptionStats,
  getTodaysBookings,
  checkInGuest,
  checkOutGuest,
  getRoomStatus,
  updateRoomStatus,
  createWalkInBooking
} from '../controllers/receptionController';
import { verifyToken, receptionOnly, checkActiveStatus } from '../middleware/roleAuth';

const router = express.Router();

// All reception routes require authentication, reception role, and active status
router.use(verifyToken);
router.use(checkActiveStatus);
router.use(receptionOnly);

// Dashboard stats
router.get('/stats', getReceptionStats);

// Today's bookings
router.get('/bookings/today', getTodaysBookings);

// Check-in/Check-out
router.post('/bookings/:id/checkin', checkInGuest);
router.post('/bookings/:id/checkout', checkOutGuest);

// Room status management
router.get('/rooms/status', getRoomStatus);
router.put('/rooms/:id/status', updateRoomStatus);

// Walk-in bookings
router.post('/bookings', createWalkInBooking);

console.log('✅ Reception routes configured');

export default router;
