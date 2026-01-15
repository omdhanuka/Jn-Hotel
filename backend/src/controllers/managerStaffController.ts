import { Request, Response } from 'express';
import Task from '../models/Task';
import StaffTask from '../models/StaffTask';
import StaffNotification from '../models/StaffNotification';
import StaffProfile from '../models/StaffProfile';
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
    if (category && category !== 'all') filter.taskType = category;
    if (staffId) filter.assignedTo = staffId;

    const tasks = await StaffTask.find(filter)
      .populate('assignedTo', 'firstName lastName department position')
      .populate('assignedBy', 'firstName lastName')
      .populate('room', 'roomNumber')
      .sort({ dueTime: 1, priority: -1 });

    // Transform tasks to match frontend format for backward compatibility
    const transformedTasks = tasks.map(task => ({
      _id: task._id,
      taskId: task._id, // For backward compatibility
      staffId: task.assignedTo, // This is already populated
      category: task.taskType,
      roomNumber: (task.room as any)?.roomNumber,
      priority: task.priority,
      status: task.status,
      deadline: task.dueTime,
      notes: task.description,
      createdAt: task.createdAt,
      // Include new fields too
      taskType: task.taskType,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      room: task.room,
      dueTime: task.dueTime
    }));

    res.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    // Support both old and new formats for backward compatibility
    const { 
      // New format
      staffId, taskType, title, description, roomId, priority, dueTime,
      // Old format (backward compatibility)
      category, roomNumber, deadline, notes 
    } = req.body;

    const finalStaffId = staffId;
    if (!finalStaffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    // Validate staff exists and is active
    const staff = await User.findById(finalStaffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    if (!staff.isActive) {
      return res.status(400).json({ message: 'Cannot assign tasks to inactive staff' });
    }

    // Validate StaffProfile exists
    const staffProfile = await StaffProfile.findOne({ user: finalStaffId });
    if (!staffProfile) {
      return res.status(400).json({ message: 'Staff profile not found. Please sync staff profiles first.' });
    }

    // Map old category to new taskType
    const taskTypeMap: any = {
      'room-cleaning': 'cleaning',
      'cleaning': 'cleaning',
      'maintenance': 'maintenance',
      'room-service': 'service',
      'service': 'service',
      'banquet': 'banquet_setup',
      'banquet_setup': 'banquet_setup',
      'restaurant': 'restaurant_service',
      'restaurant_service': 'restaurant_service'
    };

    const finalTaskType = taskType || taskTypeMap[category] || 'service';
    const finalTitle = title || `${category || taskType} - Room ${roomNumber || 'N/A'}`;
    const finalDescription = description || notes || `${category || taskType} task${roomNumber ? ` for room ${roomNumber}` : ''}`;
    const finalPriority = priority || 'medium';
    const finalDueTime = dueTime || deadline || new Date(Date.now() + 24 * 60 * 60 * 1000);

    const task = new StaffTask({
      taskType: finalTaskType,
      title: finalTitle,
      description: finalDescription,
      assignedTo: finalStaffId,
      assignedBy: req.user!._id,
      room: roomId,
      priority: finalPriority,
      dueTime: new Date(finalDueTime),
      status: 'pending'
    });

    await task.save();

    // Create notification for staff
    await StaffNotification.create({
      recipient: finalStaffId,
      type: 'task_assigned',
      title: `New Task: ${finalTitle}`,
      message: finalDescription,
      relatedTask: task._id,
      priority: finalPriority
    });

    const populatedTask = await StaffTask.findById(task._id)
      .populate('assignedTo', 'firstName lastName department')
      .populate('assignedBy', 'firstName lastName')
      .populate('room', 'roomNumber');

    res.status(201).json({ 
      message: 'Task assigned successfully and notification sent',
      task: populatedTask 
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { assignedTo, priority, dueTime, description, status } = req.body;

    const task = await StaffTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update allowed fields
    if (assignedTo) {
      const staff = await User.findById(assignedTo);
      if (!staff || staff.role !== 'staff') {
        return res.status(404).json({ message: 'Invalid staff member' });
      }
      task.assignedTo = assignedTo;
    }
    if (priority) task.priority = priority;
    if (dueTime) task.dueTime = new Date(dueTime);
    if (description !== undefined) task.description = description;
    if (status) task.status = status;

    await task.save();

    const updatedTask = await StaffTask.findById(task._id)
      .populate('assignedTo', 'firstName lastName department')
      .populate('assignedBy', 'firstName lastName')
      .populate('room', 'roomNumber');

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
    const task = await StaffTask.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete related notifications
    await StaffNotification.deleteMany({ relatedTask: req.params.id });

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

    // Return attendance records in the format the frontend expects
    const formattedAttendance = attendance.map(record => ({
      _id: record._id,
      staffId: {
        _id: (record.staffId as any)._id,
        firstName: (record.staffId as any).firstName,
        lastName: (record.staffId as any).lastName,
        department: (record.staffId as any).department
      },
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      notes: record.notes
    }));

    res.json({ attendance: formattedAttendance });
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

    // Helper function to create DateTime from date and time string
    const createDateTime = (dateStr: string, timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      const dt = new Date(dateStr);
      dt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return dt;
    };

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      staffId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing
      attendance.checkIn = checkIn ? createDateTime(date, checkIn) : attendance.checkIn;
      attendance.checkOut = checkOut ? createDateTime(date, checkOut) : attendance.checkOut;
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
        checkIn: checkIn ? createDateTime(date, checkIn) : undefined,
        checkOut: checkOut ? createDateTime(date, checkOut) : undefined,
        shiftStart: shiftStart || '09:00',
        shiftEnd: shiftEnd || '17:00',
        status: status || 'present',
        notes
      });
      await attendance.save();
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('staffId', 'firstName lastName department');

    // Format the response to match frontend expectations
    const formattedResponse = {
      _id: populatedAttendance!._id,
      staffId: {
        _id: (populatedAttendance!.staffId as any)._id,
        firstName: (populatedAttendance!.staffId as any).firstName,
        lastName: (populatedAttendance!.staffId as any).lastName,
        department: (populatedAttendance!.staffId as any).department
      },
      date: populatedAttendance!.date,
      checkIn: populatedAttendance!.checkIn,
      checkOut: populatedAttendance!.checkOut,
      status: populatedAttendance!.status,
      notes: populatedAttendance!.notes
    };

    res.json({ 
      message: 'Attendance marked successfully',
      attendance: formattedResponse
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
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

export const getAttendanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, staffId } = req.query;

    // Default to current month if no dates provided
    let start = startDate ? new Date(startDate as string) : new Date();
    let end = endDate ? new Date(endDate as string) : new Date();

    if (!startDate) {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    }
    if (!endDate) {
      end = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get all active staff or specific staff
    const staffFilter: any = { 
      role: { $in: ['staff', 'reception'] },
      isActive: true 
    };
    if (staffId) {
      staffFilter._id = staffId;
    }

    const allStaff = await User.find(staffFilter)
      .select('firstName lastName department position')
      .sort({ firstName: 1 });

    // Get attendance records for the date range
    const attendanceRecords = await Attendance.find({
      staffId: { $in: allStaff.map(s => s._id) },
      date: { $gte: start, $lte: end }
    }).populate('staffId', 'firstName lastName department');

    // Group attendance by staff
    const attendanceByStaff = new Map();
    attendanceRecords.forEach(record => {
      const staffId = (record.staffId as any)._id.toString();
      if (!attendanceByStaff.has(staffId)) {
        attendanceByStaff.set(staffId, []);
      }
      attendanceByStaff.get(staffId).push(record);
    });

    // Calculate statistics for each staff member
    const report = allStaff.map(staff => {
      const records = attendanceByStaff.get(staff._id.toString()) || [];
      
      const stats = {
        present: records.filter((r: any) => r.status === 'present').length,
        absent: records.filter((r: any) => r.status === 'absent').length,
        late: records.filter((r: any) => r.status === 'late').length,
        onLeave: records.filter((r: any) => r.status === 'on-leave').length,
        halfDay: records.filter((r: any) => r.status === 'half-day').length
      };

      // Calculate total working days (excluding leaves)
      const totalMarked = records.length;
      const totalWorkingDays = stats.present + stats.late + stats.halfDay;
      
      // Calculate attendance percentage
      const attendancePercentage = totalMarked > 0 
        ? ((totalWorkingDays / totalMarked) * 100).toFixed(2)
        : '0.00';

      return {
        staffId: staff._id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        department: staff.department,
        position: staff.position,
        statistics: {
          ...stats,
          totalPresent: totalWorkingDays,
          totalMarked,
          attendancePercentage
        },
        records: records.map((r: any) => ({
          date: r.date,
          status: r.status,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          notes: r.notes
        }))
      };
    });

    res.json({ 
      report,
      dateRange: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalStaff: allStaff.length,
        totalRecords: attendanceRecords.length
      }
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Failed to generate attendance report' });
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
