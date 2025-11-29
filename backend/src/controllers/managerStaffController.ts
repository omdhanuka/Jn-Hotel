import { Request, Response } from 'express';
import Task from '../models/Task';
import Attendance from '../models/Attendance';
import StaffRequest from '../models/StaffRequest';
import User, { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

// ===== TASK MANAGEMENT =====

export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, category, staffId } = req.query;
    
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;
    if (staffId) filter.staffId = staffId;

    const tasks = await Task.find(filter)
      .populate('staffId', 'firstName lastName department position')
      .populate('assignedBy', 'firstName lastName')
      .sort({ deadline: 1, priority: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, category, roomNumber, priority, deadline, notes } = req.body;

    // Validate staff exists
    const staff = await User.findById(staffId);
    if (!staff || (staff.role !== 'staff' && staff.role !== 'reception')) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const task = new Task({
      staffId,
      assignedBy: req.user!._id,
      category,
      roomNumber,
      priority,
      deadline: new Date(deadline),
      notes
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('staffId', 'firstName lastName department')
      .populate('assignedBy', 'firstName lastName');

    res.status(201).json({ 
      message: 'Task assigned successfully',
      task: populatedTask 
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, priority, deadline, notes, status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update allowed fields
    if (staffId) task.staffId = staffId;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = new Date(deadline);
    if (notes !== undefined) task.notes = notes;
    if (status) task.status = status;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('staffId', 'firstName lastName department')
      .populate('assignedBy', 'firstName lastName');

    res.json({ 
      message: 'Task updated successfully',
      task: updatedTask 
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== STAFF PERFORMANCE =====

export const getStaffPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all staff members
    const staff = await User.find({ role: { $in: ['staff', 'reception'] } })
      .select('firstName lastName department position');

    const performanceData = await Promise.all(
      staff.map(async (member) => {
        const tasks = await Task.find({
          staffId: member._id,
          createdAt: { $gte: start, $lte: end }
        });

        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'assigned' || t.status === 'in-progress').length;
        const delayed = tasks.filter(t => 
          t.status !== 'completed' && 
          t.status !== 'cancelled' && 
          new Date(t.deadline) < new Date()
        ).length;

        // Calculate average completion time
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completionTime && t.startTime);
        const avgTime = completedTasks.length > 0 
          ? completedTasks.reduce((sum, t) => {
              const duration = t.completionTime!.getTime() - t.startTime!.getTime();
              return sum + duration;
            }, 0) / completedTasks.length
          : 0;

        return {
          staffId: member._id,
          name: `${member.firstName} ${member.lastName}`,
          department: member.department,
          position: member.position,
          completedTasks: completed,
          pendingTasks: pending,
          delayedTasks: delayed,
          totalTasks: tasks.length,
          averageTime: Math.round(avgTime / (1000 * 60)), // in minutes
          performanceScore: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
        };
      })
    );

    // Sort by performance score
    performanceData.sort((a, b) => b.performanceScore - a.performanceScore);

    res.json({ performance: performanceData });
  } catch (error) {
    console.error('Get staff performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== ATTENDANCE MANAGEMENT =====

export const getTodayAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('staffId', 'firstName lastName department position');

    // Get all staff to show who hasn't marked attendance
    const allStaff = await User.find({ 
      role: { $in: ['staff', 'reception'] },
      isActive: true 
    }).select('firstName lastName department position');

    const attendanceMap = new Map(
      attendance.map(a => [a.staffId._id.toString(), a])
    );

    const completeAttendance = allStaff.map(staff => {
      const record = attendanceMap.get(staff._id.toString());
      return {
        staffId: staff._id,
        name: `${staff.firstName} ${staff.lastName}`,
        department: staff.department,
        position: staff.position,
        checkIn: record?.checkIn,
        checkOut: record?.checkOut,
        shiftStart: record?.shiftStart || '09:00',
        shiftEnd: record?.shiftEnd || '17:00',
        status: record?.status || 'absent',
        notes: record?.notes
      };
    });

    res.json({ attendance: completeAttendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, date, checkIn, checkOut, shiftStart, shiftEnd, status, notes } = req.body;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      staffId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing
      attendance.checkIn = checkIn ? new Date(checkIn) : attendance.checkIn;
      attendance.checkOut = checkOut ? new Date(checkOut) : attendance.checkOut;
      attendance.shiftStart = shiftStart || attendance.shiftStart;
      attendance.shiftEnd = shiftEnd || attendance.shiftEnd;
      attendance.status = status || attendance.status;
      attendance.notes = notes;
      await attendance.save();
    } else {
      // Create new
      attendance = new Attendance({
        staffId,
        date: attendanceDate,
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        shiftStart: shiftStart || '09:00',
        shiftEnd: shiftEnd || '17:00',
        status: status || 'present',
        notes
      });
      await attendance.save();
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('staffId', 'firstName lastName');

    res.json({ 
      message: 'Attendance marked successfully',
      attendance: populatedAttendance 
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAttendanceHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    const filter: any = {};
    if (staffId) filter.staffId = staffId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const attendance = await Attendance.find(filter)
      .populate('staffId', 'firstName lastName department')
      .sort({ date: -1 });

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== STAFF REQUESTS =====

export const getStaffRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, priority } = req.query;

    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.requestType = type;
    if (priority && priority !== 'all') filter.priority = priority;

    const requests = await StaffRequest.find(filter)
      .populate('staffId', 'firstName lastName department position')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get staff requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, reviewNotes } = req.body;

    const request = await StaffRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.reviewNotes = reviewNotes;
    request.reviewedBy = req.user!._id;
    request.reviewedAt = new Date();

    await request.save();

    const updatedRequest = await StaffRequest.findById(request._id)
      .populate('staffId', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName');

    res.json({ 
      message: 'Request status updated successfully',
      request: updatedRequest 
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== DASHBOARD STATS =====

export const getStaffManagementStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total active staff
    const totalStaff = await User.countDocuments({ 
      role: { $in: ['staff', 'reception'] },
      isActive: true 
    });

    // Today's attendance
    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'present'
    });

    // Pending tasks
    const pendingTasks = await Task.countDocuments({
      status: { $in: ['assigned', 'in-progress'] }
    });

    // Pending requests
    const pendingRequests = await StaffRequest.countDocuments({
      status: 'pending'
    });

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      status: { $in: ['assigned', 'in-progress'] },
      deadline: { $lt: new Date() }
    });

    res.json({
      totalStaff,
      presentToday,
      absentToday: totalStaff - presentToday,
      pendingTasks,
      overdueTasks,
      pendingRequests
    });
  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
