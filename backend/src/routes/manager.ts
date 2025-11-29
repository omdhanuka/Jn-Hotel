import express from 'express';
import {
  getManagerDashboard,
  getAllBookingsForManager,
  getBookingDetailsForManager,
  updateBookingByManager,
  updateBookingStatus,
  assignResource
} from '../controllers/managerController';
import { verifyToken, managerOnly, checkActiveStatus } from '../middleware/roleAuth';
import {
  getAllRoomOperations,
  getRoomOperationDetails,
  updateRoomStatus,
  assignRoomToBooking,
  releaseRoom,
  moveGuestToAnotherRoom,
  completeCleaningOrMaintenance,
  getAvailableRoomsForMove
} from '../controllers/managerRoomController';

const router = express.Router();

// All manager routes require authentication, manager role, and active status
router.use(verifyToken);
router.use(checkActiveStatus);
router.use(managerOnly);

// Dashboard
router.get('/dashboard', getManagerDashboard);

// Bookings Management
router.get('/bookings', getAllBookingsForManager);
router.get('/bookings/:id', getBookingDetailsForManager);
router.patch('/bookings/:id', updateBookingByManager);
router.patch('/bookings/:id/status', updateBookingStatus);
router.patch('/bookings/:id/assign', assignResource);

// Room Operations Management
router.get('/rooms', getAllRoomOperations);
router.get('/rooms/:id', getRoomOperationDetails);
router.patch('/rooms/:id/status', updateRoomStatus);
router.patch('/rooms/:id/assign', assignRoomToBooking);
router.patch('/rooms/:id/release', releaseRoom);
router.patch('/rooms/:id/move-guest', moveGuestToAnotherRoom);
router.patch('/rooms/:id/complete', completeCleaningOrMaintenance);
router.get('/rooms/available/for-move', getAvailableRoomsForMove);

console.log('✅ Manager routes configured with room operations');

export default router;
