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
  getUserPermissions,
  syncStaffProfiles,
  getAllComplaintsForAdmin,
  getComplaintDashboardForAdmin
} from '../controllers/adminController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import User from '../models/User'; // Add this import
import {
  getAllLeaveApplications,
  approveLeave,
  rejectLeave,
  getLeaveStatistics
} from '../controllers/staffLeaveController';
import {
  getTodayAttendance,
  markAttendance,
  getAttendanceHistory,
  getAttendanceReport
} from '../controllers/managerStaffController';

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
router.post('/staff/sync-profiles', syncStaffProfiles);

// Complaint Management
router.get('/complaints/dashboard', getComplaintDashboardForAdmin);
router.get('/complaints', getAllComplaintsForAdmin);

// Leave Management
router.get('/staff/leaves', getAllLeaveApplications);
router.get('/staff/leaves/statistics', getLeaveStatistics);
router.put('/staff/leaves/:leaveId/approve', approveLeave);
router.put('/staff/leaves/:leaveId/reject', rejectLeave);

// Attendance Management
router.get('/staff/attendance/today', getTodayAttendance);
router.get('/staff/attendance/history', getAttendanceHistory);
router.get('/staff/attendance/report', getAttendanceReport);
router.post('/staff/attendance', markAttendance);

// Debug endpoint to check staff in database
router.get('/debug/staff-count', async (req, res) => {
  try {
    const allUsers = await User.find().select('email role firstName lastName');
    const staffCount = {
      total: allUsers.length,
      guests: allUsers.filter((u: any) => u.role === 'guest').length,
      staff: allUsers.filter((u: any) => u.role === 'staff').length,
      reception: allUsers.filter((u: any) => u.role === 'reception').length,
      managers: allUsers.filter((u: any) => u.role === 'manager').length,
      admins: allUsers.filter((u: any) => u.role === 'admin').length,
      users: allUsers.map((u: any) => ({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role
      }))
    };
    res.json(staffCount);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Failed to get staff count' });
  }
});

console.log('✅ Admin routes configured with permissions endpoint');

export default router;
