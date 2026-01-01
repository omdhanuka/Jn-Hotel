import express from 'express';
import multer from 'multer';
import { staffAuth } from '../middleware/staffAuth';
import * as staffTaskController from '../controllers/staffTaskController';
import * as staffProfileController from '../controllers/staffProfileController';
import * as staffLeaveController from '../controllers/staffLeaveController';
import * as staffNotificationController from '../controllers/staffNotificationController';

const router = express.Router();

// Configure multer for task photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tasks/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname.split('.').pop();
    cb(null, `task-${uniqueSuffix}.${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Task routes
router.get('/tasks', staffAuth, staffTaskController.getMyTasks);
router.get('/tasks/stats', staffAuth, staffTaskController.getMyTaskStats);
router.get('/tasks/:taskId', staffAuth, staffTaskController.getTaskById);
router.patch('/tasks/:taskId/start', staffAuth, staffTaskController.startTask);
router.patch('/tasks/:taskId/complete', staffAuth, upload.array('photos', 5), staffTaskController.completeTask);

// Profile routes
router.get('/profile', staffAuth, staffProfileController.getMyProfile);
router.patch('/profile', staffAuth, staffProfileController.updateMyProfile);
router.get('/profile/performance', staffAuth, staffProfileController.getMyPerformanceMetrics);
router.get('/profile/activity', staffAuth, staffProfileController.getMyActivityLog);

// Leave routes
router.post('/leaves', staffAuth, staffLeaveController.applyLeave);
router.get('/leaves', staffAuth, staffLeaveController.getMyLeaves);
router.get('/leaves/balance', staffAuth, staffLeaveController.getLeaveBalance);
router.delete('/leaves/:leaveId', staffAuth, staffLeaveController.cancelLeave);

// Notification routes
router.get('/notifications', staffAuth, staffNotificationController.getMyNotifications);
router.get('/notifications/unread-count', staffAuth, staffNotificationController.getUnreadCount);
router.patch('/notifications/:notificationId/read', staffAuth, staffNotificationController.markAsRead);
router.patch('/notifications/read-all', staffAuth, staffNotificationController.markAllAsRead);

export default router;
