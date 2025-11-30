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
import {
  searchBookings,
  getAvailableRooms,
  assignRoom,
  completeCheckIn,
  searchActiveGuests,
  addExtraCharge,
  completeCheckOut,
  getInvoice,
  getRecentActivities
} from '../controllers/managerCheckInOutController';
import {
  getStaffManagementStats,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getStaffPerformance,
  getTodayAttendance,
  markAttendance,
  getAttendanceHistory,
  getStaffRequests,
  updateRequestStatus
} from '../controllers/managerStaffController';
import {
  getAllBanquetHalls,
  getBanquetBookings,
  getBanquetBookingById,
  updateBanquetBooking,
  assignBanquetHall,
  getBanquetStats,
  getBanquetCalendar
} from '../controllers/managerBanquetController';
import User from '../models/User';

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

// Check-In Operations
router.get('/booking/search', searchBookings);
router.get('/rooms/available', getAvailableRooms);
router.patch('/booking/assign-room', assignRoom);
router.post('/booking/checkin', completeCheckIn);

// Check-Out Operations
router.get('/active-guests', searchActiveGuests);
router.post('/charges/add', addExtraCharge);
router.post('/checkout', completeCheckOut);
router.get('/invoice/:bookingId', getInvoice);

// Recent check-in/out activities
router.get('/checkin-checkout/recent-activities', getRecentActivities);

// Staff Task Management
router.get('/staff/stats', getStaffManagementStats);
router.get('/staff/tasks', getAllTasks);
router.post('/staff/tasks', createTask);
router.put('/staff/tasks/:id', updateTask);
router.delete('/staff/tasks/:id', deleteTask);

// Staff Performance
router.get('/staff/performance', getStaffPerformance);

// Attendance Management
router.get('/staff/attendance/today', getTodayAttendance);
router.post('/staff/attendance', markAttendance);
router.get('/staff/attendance/history', getAttendanceHistory);

// Staff Requests
router.get('/staff/requests', getStaffRequests);
router.put('/staff/requests/:id', updateRequestStatus);

// Staff list for task assignment (managers can view staff list)
router.get('/staff/list', async (req, res) => {
  try {
    const staff = await User.find({ 
      role: { $in: ['staff', 'reception'] },
      isActive: true 
    })
      .select('firstName lastName email department position role')
      .sort({ firstName: 1 });

    console.log(`📋 Manager fetching staff list: ${staff.length} active staff members found`);
    
    res.json({ 
      staff,
      count: staff.length 
    });
  } catch (error) {
    console.error('Manager get staff list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Banquet Management Routes
router.get('/banquets', getAllBanquetHalls);
router.get('/banquets/bookings', getBanquetBookings);
router.get('/banquets/stats', getBanquetStats);
router.get('/banquets/calendar', getBanquetCalendar);
router.get('/banquets/:id', getBanquetBookingById);
router.patch('/banquets/:id', updateBanquetBooking);
router.post('/banquets/assign', assignBanquetHall);

console.log('✅ Manager routes configured with room operations');
console.log('✅ Manager check-in/out routes configured');
console.log('✅ Manager staff task routes configured');
console.log('✅ Manager banquet routes configured');

export default router;
