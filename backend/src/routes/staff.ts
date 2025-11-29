import express from 'express';
import {
  getStaffBookings,
  updateBookingStatusByStaff
} from '../controllers/staffController';
import {
  getRoomStats,
  getAllRoomsStatus,
  updateRoomStatus,
  getCleaningTasks,
  createCleaningTask,
  updateCleaningTask,
  getMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  getRoomNotes,
  createRoomNote,
  resolveRoomNote,
  getRoomInventory,
  updateRoomInventory,
  completeInspection,
  getStaffActivityLog
} from '../controllers/staffRoomController';
import { verifyToken, staffOnly, checkActiveStatus } from '../middleware/roleAuth';
import { requirePermission } from '../middleware/permissionAuth';

const router = express.Router();

// All staff routes require authentication, staff role, and active status
router.use(verifyToken);
router.use(checkActiveStatus);
router.use(staffOnly);

// Booking management - requires viewBookings permission
router.get('/bookings', requirePermission('viewBookings'), getStaffBookings);
router.put('/bookings/:id/status', requirePermission('manageBookings'), updateBookingStatusByStaff);

// Room dashboard stats - requires viewRooms permission
router.get('/rooms/stats', requirePermission('viewRooms'), getRoomStats);

// Room status management - requires manageRooms permission
router.get('/rooms/status', requirePermission('viewRooms'), getAllRoomsStatus);
router.put('/rooms/:id/status', requirePermission('manageRooms'), updateRoomStatus);

// Cleaning tasks - requires viewRooms permission
router.get('/rooms/cleaning-tasks', requirePermission('viewRooms'), getCleaningTasks);
router.post('/rooms/cleaning-tasks', requirePermission('manageRooms'), createCleaningTask);
router.put('/rooms/cleaning-tasks/:id', requirePermission('manageRooms'), updateCleaningTask);

// Maintenance tasks - requires viewRooms permission
router.get('/rooms/maintenance-tasks', requirePermission('viewRooms'), getMaintenanceTasks);
router.post('/rooms/maintenance-tasks', requirePermission('manageRooms'), createMaintenanceTask);
router.put('/rooms/maintenance-tasks/:id', requirePermission('manageRooms'), updateMaintenanceTask);

// Room notes - requires viewRooms permission
router.get('/rooms/notes', requirePermission('viewRooms'), getRoomNotes);
router.post('/rooms/notes', requirePermission('manageRooms'), createRoomNote);
router.put('/rooms/notes/:id/resolve', requirePermission('manageRooms'), resolveRoomNote);

// Room inventory - requires viewRooms permission
router.get('/rooms/:roomId/inventory', requirePermission('viewRooms'), getRoomInventory);
router.put('/rooms/inventory', requirePermission('manageRooms'), updateRoomInventory);

// Room inspection - requires manageRooms permission
router.post('/rooms/inspection', requirePermission('manageRooms'), completeInspection);

// Activity log - requires viewRooms permission
router.get('/rooms/activity-log', requirePermission('viewRooms'), getStaffActivityLog);

export default router;
