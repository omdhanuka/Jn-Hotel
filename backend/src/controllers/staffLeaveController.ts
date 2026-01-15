import { Request, Response } from 'express';
import StaffLeave from '../models/StaffLeave';
import StaffProfile from '../models/StaffProfile';
import StaffNotification from '../models/StaffNotification';

interface AuthRequest extends Request {
  user?: any;
}

export const applyLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { leaveType, startDate, endDate, reason, numberOfDays } = req.body;

    let staffProfile = await StaffProfile.findOne({ user: req.user._id });
    
    // Auto-create profile if it doesn't exist
    if (!staffProfile) {
      const count = await StaffProfile.countDocuments();
      const staffId = `STAFF${String(count + 1).padStart(4, '0')}`;
      
      staffProfile = new StaffProfile({
        user: req.user._id,
        staffId,
        staffType: 'housekeeping',
        department: 'General',
        joiningDate: new Date(),
        isActive: true,
        performanceMetrics: {
          tasksCompleted: 0,
          tasksRejected: 0,
          averageCompletionTime: 0,
          rating: 5.0
        },
        leaveBalance: {
          sick: 10,
          casual: 12,
          annual: 15
        }
      });
      
      await staffProfile.save();
    }

    // Check leave balance
    const balance = staffProfile.leaveBalance[leaveType as keyof typeof staffProfile.leaveBalance];
    if (leaveType !== 'unpaid' && balance < numberOfDays) {
      return res.status(400).json({ 
        message: `Insufficient ${leaveType} leave balance. Available: ${balance} days` 
      });
    }

    const leave = new StaffLeave({
      staff: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      numberOfDays,
      reason,
      status: 'pending',
      appliedAt: new Date()
    });

    await leave.save();

    res.status(201).json({ message: 'Leave application submitted', leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await StaffLeave.find({ staff: req.user._id })
      .populate('reviewedBy', 'firstName lastName')
      .sort({ appliedAt: -1 });

    res.json({ leaves });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLeaveBalance = async (req: AuthRequest, res: Response) => {
  try {
    let staffProfile = await StaffProfile.findOne({ user: req.user._id });
    
    // Auto-create profile if it doesn't exist
    if (!staffProfile) {
      const count = await StaffProfile.countDocuments();
      const staffId = `STAFF${String(count + 1).padStart(4, '0')}`;
      
      staffProfile = new StaffProfile({
        user: req.user._id,
        staffId,
        staffType: 'housekeeping',
        department: 'General',
        joiningDate: new Date(),
        isActive: true,
        performanceMetrics: {
          tasksCompleted: 0,
          tasksRejected: 0,
          averageCompletionTime: 0,
          rating: 5.0
        },
        leaveBalance: {
          sick: 10,
          casual: 12,
          annual: 15
        }
      });
      
      await staffProfile.save();
    }

    res.json({ leaveBalance: staffProfile.leaveBalance });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelLeave = async (req: AuthRequest, res: Response) => {
  try {
    const leave = await StaffLeave.findOne({
      _id: req.params.leaveId,
      staff: req.user._id,
      status: 'pending'
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found or cannot be cancelled' });
    }

    await leave.deleteOne();
    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Manager functions
export const getAllLeaveApplications = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await StaffLeave.find()
      .populate('staff', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ appliedAt: -1 });

    res.json({ leaves });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { leaveId } = req.params;
    const { reviewNotes } = req.body;

    const leave = await StaffLeave.findById(leaveId).populate('staff');
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    leave.status = 'approved';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNotes = reviewNotes;
    await leave.save();

    // Deduct from leave balance
    if (leave.leaveType !== 'unpaid') {
      const staffProfile = await StaffProfile.findOne({ user: leave.staff });
      if (staffProfile) {
        staffProfile.leaveBalance[leave.leaveType as keyof typeof staffProfile.leaveBalance] -= leave.numberOfDays;
        await staffProfile.save();
      }
    }

    // Notify staff
    const staff: any = leave.staff;
    await StaffNotification.create({
      recipient: staff._id,
      type: 'leave_approved',
      title: 'Leave Approved ✅',
      message: `Your ${leave.leaveType} leave from ${leave.startDate.toDateString()} has been approved.`,
      relatedLeave: leave._id,
      priority: 'medium'
    });

    res.json({ message: 'Leave approved', leave });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rejectLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { leaveId } = req.params;
    const { reviewNotes } = req.body;

    const leave = await StaffLeave.findById(leaveId).populate('staff');
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    leave.status = 'rejected';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNotes = reviewNotes;
    await leave.save();

    // Notify staff
    const staff: any = leave.staff;
    await StaffNotification.create({
      recipient: staff._id,
      type: 'leave_rejected',
      title: 'Leave Rejected ❌',
      message: `Your ${leave.leaveType} leave request was not approved. ${reviewNotes || ''}`,
      relatedLeave: leave._id,
      priority: 'high'
    });

    res.json({ message: 'Leave rejected', leave });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLeaveStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      StaffLeave.countDocuments({ status: 'pending' }),
      StaffLeave.countDocuments({ status: 'approved' }),
      StaffLeave.countDocuments({ status: 'rejected' })
    ]);

    res.json({ statistics: { pending, approved, rejected } });
  } catch (error) {
    console.error('Get leave statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
