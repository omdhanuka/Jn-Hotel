import { Request, Response } from 'express';
import StaffTask from '../models/StaffTask';
import StaffProfile from '../models/StaffProfile';
import StaffNotification from '../models/StaffNotification';
import Room from '../models/Room';

interface AuthRequest extends Request {
  user?: any;
}

// Get all tasks (Manager view)
export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, staffType, startDate, endDate } = req.query;
    
    const query: any = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const tasks = await StaffTask.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('room', 'roomNumber')
      .populate('assignedBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending verification tasks
export const getPendingVerificationTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await StaffTask.find({ status: 'completed' })
      .populate('assignedTo', 'firstName lastName email')
      .populate('room', 'roomNumber')
      .sort({ completedAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get pending verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify task (Approve)
export const verifyTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { verificationNotes } = req.body;

    const task = await StaffTask.findById(taskId)
      .populate('room')
      .populate('assignedTo');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Task not ready for verification' });
    }

    task.status = 'verified';
    task.verifiedAt = new Date();
    task.verifiedBy = req.user._id;
    await task.save();

    // Update room status to ready if it's a cleaning/maintenance task
    if (task.room && (task.taskType === 'cleaning' || task.taskType === 'maintenance')) {
      const room: any = task.room;
      room.status = 'available';
      await room.save();
    }

    // Notify staff member
    const assignedTo: any = task.assignedTo;
    await StaffNotification.create({
      recipient: assignedTo._id,
      type: 'task_approved',
      title: 'Task Approved ✅',
      message: `Your task "${task.title}" has been verified and approved by the manager.`,
      relatedTask: task._id,
      priority: 'medium'
    });

    res.json({ message: 'Task verified successfully', task });
  } catch (error) {
    console.error('Verify task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject task
export const rejectTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const task = await StaffTask.findById(taskId)
      .populate('assignedTo');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Task not ready for verification' });
    }

    task.status = 'rejected';
    task.rejectionReason = rejectionReason;
    task.verifiedBy = req.user._id;
    task.verifiedAt = new Date();
    await task.save();

    // Update staff profile rejection count
    const staffProfile = await StaffProfile.findOne({ user: task.assignedTo });
    if (staffProfile) {
      staffProfile.performanceMetrics.tasksRejected += 1;
      await staffProfile.save();
    }

    // Notify staff member
    const assignedTo: any = task.assignedTo;
    await StaffNotification.create({
      recipient: assignedTo._id,
      type: 'task_rejected',
      title: 'Task Rejected ❌',
      message: `Your task "${task.title}" was rejected. Reason: ${rejectionReason}`,
      relatedTask: task._id,
      priority: 'high'
    });

    res.json({ message: 'Task rejected', task });
  } catch (error) {
    console.error('Reject task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reassign task
export const reassignTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { newAssigneeId, reason } = req.body;

    const task = await StaffTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldAssignee = task.assignedTo;
    task.assignedTo = newAssigneeId;
    task.status = 'pending';
    task.startedAt = undefined;
    await task.save();

    // Notify new assignee
    await StaffNotification.create({
      recipient: newAssigneeId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned: ${task.title}`,
      relatedTask: task._id,
      priority: task.priority === 'urgent' ? 'high' : 'medium'
    });

    // Notify old assignee
    await StaffNotification.create({
      recipient: oldAssignee,
      type: 'task_assigned',
      title: 'Task Reassigned',
      message: `Task "${task.title}" has been reassigned. ${reason || ''}`,
      priority: 'low'
    });

    res.json({ message: 'Task reassigned successfully', task });
  } catch (error) {
    console.error('Reassign task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create manual task
export const createManualTask = async (req: AuthRequest, res: Response) => {
  try {
    const {
      taskType,
      title,
      description,
      assignedTo,
      roomId,
      priority,
      dueTime,
      estimatedDuration
    } = req.body;

    const task = new StaffTask({
      taskType,
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      room: roomId,
      priority: priority || 'medium',
      status: 'pending',
      dueTime: dueTime ? new Date(dueTime) : undefined,
      isAutoGenerated: false,
      estimatedDuration: estimatedDuration || 60
    });

    await task.save();

    // Notify staff member
    await StaffNotification.create({
      recipient: assignedTo,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `Manager assigned you: ${title}`,
      relatedTask: task._id,
      priority: priority === 'urgent' ? 'high' : 'medium'
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create manual task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get task statistics
export const getTaskStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      verifiedTasks,
      rejectedTasks,
      urgentTasks
    ] = await Promise.all([
      StaffTask.countDocuments(),
      StaffTask.countDocuments({ status: 'pending' }),
      StaffTask.countDocuments({ status: 'in_progress' }),
      StaffTask.countDocuments({ status: 'completed' }),
      StaffTask.countDocuments({ status: 'verified' }),
      StaffTask.countDocuments({ status: 'rejected' }),
      StaffTask.countDocuments({ priority: 'urgent', status: { $in: ['pending', 'in_progress'] } })
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tasksCreatedToday = await StaffTask.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const tasksCompletedToday = await StaffTask.countDocuments({
      completedAt: { $gte: todayStart }
    });

    res.json({
      statistics: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        verifiedTasks,
        rejectedTasks,
        urgentTasks,
        tasksCreatedToday,
        tasksCompletedToday
      }
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
