import express from 'express';
import { verifyToken, managerOnly, checkActiveStatus } from '../middleware/roleAuth';
import {
  getManagerDashboard,
  getAllBookingsForManager,
  getBookingDetailsForManager,
  updateBookingByManager,
  updateBookingStatus,
  assignResource
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
  getAvailableRoomsForMove
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
  generateBillForTable
} from '../controllers/managerRestaurantController';

const router = express.Router();

// All manager routes require authentication, manager role, and active status
router.use(verifyToken);
router.use(checkActiveStatus);
router.use(managerOnly);

// ===== DASHBOARD =====
router.get('/dashboard', getManagerDashboard);

// ===== BOOKINGS =====
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
router.put('/rooms/:id/status', updateRoomStatus);
router.post('/rooms/:id/assign', assignRoomToBooking);
router.post('/rooms/:id/release', releaseRoom);
router.post('/rooms/:id/move', moveGuestToAnotherRoom);
router.post('/rooms/:id/complete', completeCleaningOrMaintenance);
router.get('/rooms/available/move', getAvailableRoomsForMove);

// ===== STAFF & TASK MANAGEMENT =====
router.get('/staff/stats', getStaffManagementStats);
router.get('/tasks', getAllTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.get('/staff/performance', getStaffPerformance);
router.get('/attendance/today', getTodayAttendance);
router.post('/attendance', markAttendance);
router.get('/attendance/history', getAttendanceHistory);
router.get('/staff/requests', getStaffRequests);
router.put('/staff/requests/:id', updateRequestStatus);

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

export default router;
