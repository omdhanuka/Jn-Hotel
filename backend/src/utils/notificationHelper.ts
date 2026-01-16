/**
 * Staff Notification Utility
 * Helper functions to create notifications for staff members
 */

import StaffNotification from '../models/StaffNotification';
import mongoose from 'mongoose';

interface NotificationData {
  recipient: mongoose.Types.ObjectId | string;
  type: 'task_assigned' | 'task_approved' | 'task_rejected' | 'leave_approved' | 'leave_rejected' | 'urgent' | 'shift_update';
  title: string;
  message: string;
  relatedTask?: mongoose.Types.ObjectId | string;
  relatedLeave?: mongoose.Types.ObjectId | string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Create a notification for a staff member
 */
export const createNotification = async (data: NotificationData) => {
  try {
    const notification = new StaffNotification({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedTask: data.relatedTask,
      relatedLeave: data.relatedLeave,
      priority: data.priority || 'medium',
      isRead: false
    });

    await notification.save();
    console.log(`📬 Notification created for staff: ${data.title}`);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Notify staff when a task is assigned
 */
export const notifyTaskAssigned = async (
  staffId: mongoose.Types.ObjectId | string,
  taskId: mongoose.Types.ObjectId | string,
  taskType: string,
  roomNumber?: string
) => {
  const location = roomNumber ? ` in Room ${roomNumber}` : '';
  
  return createNotification({
    recipient: staffId,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned a ${taskType} task${location}. Please check the details and start working on it.`,
    relatedTask: taskId,
    priority: 'medium'
  });
};

/**
 * Notify staff when a task is approved
 */
export const notifyTaskApproved = async (
  staffId: mongoose.Types.ObjectId | string,
  taskId: mongoose.Types.ObjectId | string,
  taskType: string
) => {
  return createNotification({
    recipient: staffId,
    type: 'task_approved',
    title: 'Task Approved! 🎉',
    message: `Your ${taskType} task has been reviewed and approved. Great work!`,
    relatedTask: taskId,
    priority: 'low'
  });
};

/**
 * Notify staff when a task is rejected
 */
export const notifyTaskRejected = async (
  staffId: mongoose.Types.ObjectId | string,
  taskId: mongoose.Types.ObjectId | string,
  taskType: string,
  reason?: string
) => {
  const reasonText = reason ? ` Reason: ${reason}` : '';
  
  return createNotification({
    recipient: staffId,
    type: 'task_rejected',
    title: 'Task Needs Revision',
    message: `Your ${taskType} task requires some revisions.${reasonText} Please review and complete it again.`,
    relatedTask: taskId,
    priority: 'high'
  });
};

/**
 * Notify staff when leave is approved
 */
export const notifyLeaveApproved = async (
  staffId: mongoose.Types.ObjectId | string,
  leaveId: mongoose.Types.ObjectId | string,
  leaveType: string,
  startDate: Date,
  endDate: Date
) => {
  const start = new Date(startDate).toLocaleDateString();
  const end = new Date(endDate).toLocaleDateString();
  
  return createNotification({
    recipient: staffId,
    type: 'leave_approved',
    title: 'Leave Request Approved ✅',
    message: `Your ${leaveType} leave request from ${start} to ${end} has been approved. Enjoy your time off!`,
    relatedLeave: leaveId,
    priority: 'medium'
  });
};

/**
 * Notify staff when leave is rejected
 */
export const notifyLeaveRejected = async (
  staffId: mongoose.Types.ObjectId | string,
  leaveId: mongoose.Types.ObjectId | string,
  leaveType: string,
  reason?: string
) => {
  const reasonText = reason ? ` Reason: ${reason}` : '';
  
  return createNotification({
    recipient: staffId,
    type: 'leave_rejected',
    title: 'Leave Request Not Approved',
    message: `Unfortunately, your ${leaveType} leave request has been rejected.${reasonText}`,
    relatedLeave: leaveId,
    priority: 'medium'
  });
};

/**
 * Send urgent notification to staff
 */
export const notifyUrgent = async (
  staffId: mongoose.Types.ObjectId | string,
  title: string,
  message: string
) => {
  return createNotification({
    recipient: staffId,
    type: 'urgent',
    title: `⚠️ ${title}`,
    message,
    priority: 'high'
  });
};

/**
 * Notify staff about shift updates
 */
export const notifyShiftUpdate = async (
  staffId: mongoose.Types.ObjectId | string,
  message: string
) => {
  return createNotification({
    recipient: staffId,
    type: 'shift_update',
    title: 'Shift Schedule Updated',
    message,
    priority: 'medium'
  });
};

/**
 * Notify multiple staff members at once
 */
export const notifyMultipleStaff = async (
  staffIds: (mongoose.Types.ObjectId | string)[],
  notificationData: Omit<NotificationData, 'recipient'>
) => {
  try {
    const notifications = staffIds.map(staffId => 
      createNotification({
        ...notificationData,
        recipient: staffId
      })
    );

    await Promise.all(notifications);
    console.log(`📬 Bulk notifications sent to ${staffIds.length} staff members`);
  } catch (error) {
    console.error('Failed to send bulk notifications:', error);
  }
};

/**
 * Delete old read notifications (cleanup)
 * Call this periodically to keep database clean
 */
export const cleanupOldNotifications = async (daysOld: number = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await StaffNotification.deleteMany({
      isRead: true,
      createdAt: { $lt: cutoffDate }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to cleanup notifications:', error);
    return 0;
  }
};
