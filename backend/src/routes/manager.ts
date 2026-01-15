import express from 'express';
import User from '../models/User';
import { verifyToken, managerOnly, checkActiveStatus } from '../middleware/roleAuth';
import {
  getManagerDashboard,
  getAllBookingsForManager,
  getBookingDetailsForManager,
  updateBookingByManager,
  updateBookingStatus,
  assignResource,
  getCalendarBookings
} from '../controllers/managerController';
import {
  getAllBanquetHalls,
  getBanquetBookings,
  getBanquetBookingById,
  updateBanquetBooking,
  assignBanquetHall,
  getBanquetStats,
  getBanquetCalendar
} from '../controllers/managerBanquetController';
import {
  getAllRoomOperations,
  getRoomOperationDetails,
  updateRoomStatus,
  assignRoomToBooking,
  releaseRoom,
  moveGuestToAnotherRoom,
  completeCleaningOrMaintenance,
  getAvailableRoomsForMove,
  createManualBooking
} from '../controllers/managerRoomController';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getStaffPerformance,
  getTodayAttendance,
  markAttendance,
  getAttendanceHistory,
  getStaffRequests,
  updateRequestStatus,
  getStaffManagementStats
} from '../controllers/managerStaffController';
import {
  getAllLeaveApplications,
  approveLeave,
  rejectLeave,
  getLeaveStatistics
} from '../controllers/staffLeaveController';
import {
  getRestaurantDashboard,
  getAllRestaurantTables,
  updateTableStatus,
  assignWaiterToTable,
  removeWaiterFromTable,
  getDineInOrders,
  createDineInOrder,
  getOrderById,
  updateOrderItems,
  updateOrderStatus,
  cancelOrder,
  getKitchenOrders,
  updateKitchenStatus,
  generateBill,
  getBills,
  getBillById,
  markBillAsPaid,
  getRestaurantReports,
  getWaiters,
  assignWaiterToOrder,
  getBillsByTable,
  generateBillForTable,
  getAllMenuItems,
  updateMenuItemAvailability,
  updateMenuItemStock,
  getTodaySpecials,
  createTodaySpecial,
  updateTodaySpecial,
  deleteTodaySpecial,
  updateTodaySpecialStock
} from '../controllers/managerRestaurantController';
import {
  getCheckinCheckoutStats,
  getRecentActivities,
  getTodayArrivals,
  getTodayDepartures,
  performCheckin,
  performCheckout,
  searchBookings
} from '../controllers/managerCheckinCheckoutController';
import {
  getComplaintDashboard,
  getAllComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  addInternalNote,
  getComplaintReports,
  getAvailableStaff
} from '../controllers/managerComplaintController';

const router = express.Router();

// PUBLIC ENDPOINTS (No authentication required)
// Today's Specials - Public read-only access for customers
router.get('/restaurant/specials/today/public', getTodaySpecials);

// All manager routes require authentication, manager role, and active status
router.use(verifyToken);
router.use(checkActiveStatus);
router.use(managerOnly);

// ===== DASHBOARD =====
router.get('/dashboard', getManagerDashboard);

// ===== BOOKINGS =====
router.get('/bookings/calendar', getCalendarBookings);
router.get('/bookings', getAllBookingsForManager);
router.get('/bookings/:id', getBookingDetailsForManager);
router.put('/bookings/:id', updateBookingByManager);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/assign-resource', assignResource);

// ===== BANQUET MANAGEMENT =====
router.get('/banquets', getAllBanquetHalls);
router.get('/banquets/stats', getBanquetStats);
router.get('/banquets/calendar', getBanquetCalendar);
router.get('/banquets/bookings', getBanquetBookings);
router.get('/banquets/:id', getBanquetBookingById);
router.patch('/banquets/:id', updateBanquetBooking);
router.post('/banquets/assign-hall', assignBanquetHall);

// ===== ROOM OPERATIONS =====
router.get('/rooms', getAllRoomOperations);
router.get('/rooms/:id', getRoomOperationDetails);
router.patch('/rooms/:id/status', updateRoomStatus);
router.post('/rooms/:id/assign', assignRoomToBooking);
router.post('/rooms/:id/release', releaseRoom); // This is correct - should be POST
router.post('/rooms/:id/move', moveGuestToAnotherRoom);
router.patch('/rooms/:id/complete', completeCleaningOrMaintenance);
router.get('/rooms/available/move', getAvailableRoomsForMove);
router.post('/rooms/manual-booking', createManualBooking); // Manual offline booking

// ===== STAFF & TASK MANAGEMENT =====
router.get('/staff/stats', getStaffManagementStats);
router.get('/staff/list', async (req, res) => {
  // Get all active staff members for task assignment
  try {
    const staff = await User.find({ 
      role: { $in: ['staff', 'reception'] },
      isActive: true 
    }).select('firstName lastName department position email');
    
    res.json({ staff });
  } catch (error) {
    console.error('Get staff list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/staff/tasks', getAllTasks);
router.post('/staff/tasks', createTask);
router.put('/staff/tasks/:id', updateTask);
router.delete('/staff/tasks/:id', deleteTask);
router.get('/tasks', getAllTasks); // Keep old route for backward compatibility
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.get('/staff/performance', getStaffPerformance);
router.get('/staff/attendance/today', getTodayAttendance); // Add this line
router.get('/attendance/today', getTodayAttendance);
router.post('/staff/attendance', markAttendance); // Add this line
router.post('/attendance', markAttendance);
router.get('/staff/attendance/history', getAttendanceHistory); // Add this line
router.get('/attendance/history', getAttendanceHistory);
router.get('/staff/requests', getStaffRequests);
router.put('/staff/requests/:id', updateRequestStatus);

// Leave Management
router.get('/staff/leaves', getAllLeaveApplications);
router.get('/staff/leaves/statistics', getLeaveStatistics);
router.put('/staff/leaves/:leaveId/approve', approveLeave);
router.put('/staff/leaves/:leaveId/reject', rejectLeave);

// TEST ROUTE - Remove after debugging
router.post('/restaurant/tables/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'Test route works' });
});

// ===== RESTAURANT MANAGEMENT (DINE-IN ONLY) =====
router.get('/restaurant/dashboard', getRestaurantDashboard);
router.get('/restaurant/tables', getAllRestaurantTables);
router.put('/restaurant/tables/:id/status', updateTableStatus);
router.post('/restaurant/tables/:id/assign-waiter', assignWaiterToTable);
router.delete('/restaurant/tables/:id/waiter', removeWaiterFromTable);
router.get('/restaurant/orders', getDineInOrders);
router.post('/restaurant/orders', createDineInOrder);
router.get('/restaurant/orders/:id', getOrderById);
router.put('/restaurant/orders/:id/items', updateOrderItems);
router.put('/restaurant/orders/:id/status', updateOrderStatus);
router.post('/restaurant/orders/:id/assign-waiter', assignWaiterToOrder);
router.delete('/restaurant/orders/:id', cancelOrder);
router.get('/restaurant/kitchen', getKitchenOrders);
router.put('/restaurant/kitchen/:id', updateKitchenStatus);
router.post('/restaurant/bills', generateBill);
router.get('/restaurant/bills', getBills);
router.get('/restaurant/bills/table/:tableNumber', getBillsByTable);
router.post('/restaurant/bills/generate-for-table', generateBillForTable);
router.get('/restaurant/bills/:id', getBillById);
router.put('/restaurant/bills/:id/paid', markBillAsPaid);
router.get('/restaurant/reports', getRestaurantReports);
router.get('/restaurant/waiters', getWaiters);
// Menu management - existing
router.get('/restaurant/menu', getAllMenuItems);
router.put('/restaurant/menu/:id/availability', updateMenuItemAvailability);
router.put('/restaurant/menu/:id/stock', updateMenuItemStock);

// Today's Specials - NEW (separate from regular menu)
router.get('/restaurant/specials/today', getTodaySpecials);
router.post('/restaurant/specials/today', createTodaySpecial);
router.put('/restaurant/specials/today/:id', updateTodaySpecial);
router.delete('/restaurant/specials/today/:id', deleteTodaySpecial);
router.put('/restaurant/specials/today/:id/stock', updateTodaySpecialStock);

// ===== CHECK-IN / CHECK-OUT MANAGEMENT =====
router.get('/checkin-checkout/stats', getCheckinCheckoutStats);
router.get('/checkin-checkout/recent-activities', getRecentActivities);
router.get('/checkin-checkout/today-arrivals', getTodayArrivals);
router.get('/checkin-checkout/today-departures', getTodayDepartures);
router.post('/checkin-checkout/:id/checkin', performCheckin);
router.post('/checkin-checkout/:id/checkout', performCheckout);
router.get('/booking/search', searchBookings); // Add search route

// ===== COMPLAINT MANAGEMENT =====
router.get('/complaints/dashboard', getComplaintDashboard);
router.get('/complaints/reports', getComplaintReports);
router.get('/complaints/staff/available', getAvailableStaff);
router.get('/complaints', getAllComplaints);
router.get('/complaints/:id', getComplaintById);
router.post('/complaints/:id/assign', assignComplaint);
router.put('/complaints/:id/status', updateComplaintStatus);
router.post('/complaints/:id/notes', addInternalNote);

// Staff Task Management (imported from managerTaskController)
import * as managerTaskController from '../controllers/managerTaskController';
import * as staffLeaveController from '../controllers/staffLeaveController';

router.get('/staff-tasks', managerTaskController.getAllTasks);
router.get('/staff-tasks/pending-verification', managerTaskController.getPendingVerificationTasks);
router.get('/staff-tasks/statistics', managerTaskController.getTaskStatistics);
router.post('/staff-tasks', managerTaskController.createManualTask);
router.patch('/staff-tasks/:taskId/verify', managerTaskController.verifyTask);
router.patch('/staff-tasks/:taskId/reject', managerTaskController.rejectTask);
router.patch('/staff-tasks/:taskId/reassign', managerTaskController.reassignTask);

// Staff Leave Management
router.get('/staff-leaves', staffLeaveController.getAllLeaveApplications);
router.get('/staff-leaves/statistics', staffLeaveController.getLeaveStatistics);
router.patch('/staff-leaves/:leaveId/approve', staffLeaveController.approveLeave);
router.patch('/staff-leaves/:leaveId/reject', staffLeaveController.rejectLeave);

export default router;
