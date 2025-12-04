import { Request, Response } from 'express';
import Complaint from '../models/Complaint';
import User, { IUser } from '../models/User';
import Booking from '../models/Booking';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getComplaintDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in-progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const highPriorityComplaints = await Complaint.countDocuments({ 
      priority: { $in: ['high', 'critical'] },
      status: { $in: ['pending', 'in-progress'] }
    });

    // Get complaint trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category breakdown
    const categoryBreakdown = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      stats: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        highPriorityComplaints
      },
      trends: trendData,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Get complaint dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      startDate,
      endDate,
      search
    } = req.query;

    const filter: any = {};

    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    let complaints = await Complaint.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName')
      .populate('booking', 'resourceId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    // Apply search
    if (search) {
      const searchLower = (search as string).toLowerCase();
      complaints = complaints.filter(c => {
        const userName = `${(c.user as any)?.firstName} ${(c.user as any)?.lastName}`.toLowerCase();
        const complaintId = c.complaintId.toLowerCase();
        return userName.includes(searchLower) || complaintId.includes(searchLower);
      });
    }

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComplaintById = async (req: AuthRequest, res: Response) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName department')
      .populate('booking')
      .populate('timeline.performedBy', 'firstName lastName')
      .populate('resolution.resolvedBy', 'firstName lastName');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ complaint });
  } catch (error) {
    console.error('Get complaint details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, remarks } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const staff = await User.findById(staffId);
    if (!staff || (staff.role !== 'staff' && staff.role !== 'reception')) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    complaint.assignedTo = staffId;
    complaint.status = 'in-progress';
    complaint.timeline.push({
      timestamp: new Date(),
      action: 'assigned',
      performedBy: req.user!._id,
      remarks: remarks || `Assigned to ${staff.firstName} ${staff.lastName}`
    });

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('assignedTo', 'firstName lastName');

    res.json({
      message: 'Complaint assigned successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, remarks, resolutionDescription } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const oldStatus = complaint.status;
    complaint.status = status;

    // Add timeline entry
    complaint.timeline.push({
      timestamp: new Date(),
      action: `status_changed_${oldStatus}_to_${status}`,
      performedBy: req.user!._id,
      remarks
    });

    // If resolving, add resolution
    if (status === 'resolved' && resolutionDescription) {
      complaint.resolution = {
        description: resolutionDescription,
        resolvedBy: req.user!._id,
        resolvedAt: new Date()
      };
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('user', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');

    res.json({
      message: 'Complaint status updated',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addInternalNote = async (req: AuthRequest, res: Response) => {
  try {
    const { note } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.internalNotes = complaint.internalNotes 
      ? `${complaint.internalNotes}\n\n[${new Date().toLocaleString()}] ${req.user!.firstName} ${req.user!.lastName}:\n${note}`
      : `[${new Date().toLocaleString()}] ${req.user!.firstName} ${req.user!.lastName}:\n${note}`;

    complaint.timeline.push({
      timestamp: new Date(),
      action: 'note_added',
      performedBy: req.user!._id,
      remarks: 'Internal note added'
    });

    await complaint.save();

    res.json({ message: 'Note added successfully', complaint });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComplaintReports = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Complaints by category
    const byCategory = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Complaints by priority
    const byPriority = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Resolution time statistics
    const resolutionStats = await Complaint.aggregate([
      {
        $match: {
          status: 'resolved',
          createdAt: { $gte: startDate },
          'resolution.resolvedAt': { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTime' },
          minResolutionTime: { $min: '$resolutionTime' },
          maxResolutionTime: { $max: '$resolutionTime' }
        }
      }
    ]);

    // Staff performance
    const staffPerformance = await Complaint.aggregate([
      {
        $match: {
          assignedTo: { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $project: {
          staffName: { $concat: ['$staff.firstName', ' ', '$staff.lastName'] },
          totalAssigned: 1,
          resolved: 1,
          resolutionRate: {
            $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100]
          }
        }
      },
      { $sort: { totalAssigned: -1 } }
    ]);

    // Daily complaints
    const dailyComplaints = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      period,
      byCategory,
      byPriority,
      resolutionStats: resolutionStats[0] || {
        avgResolutionTime: 0,
        minResolutionTime: 0,
        maxResolutionTime: 0
      },
      staffPerformance,
      dailyComplaints
    });
  } catch (error) {
    console.error('Get complaint reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAvailableStaff = async (req: AuthRequest, res: Response) => {
  try {
    const staff = await User.find({
      role: { $in: ['staff', 'reception'] },
      isActive: true
    }).select('firstName lastName department position');

    // Get current workload for each staff
    const staffWithWorkload = await Promise.all(
      staff.map(async (member) => {
        const assignedComplaints = await Complaint.countDocuments({
          assignedTo: member._id,
          status: { $in: ['pending', 'in-progress'] }
        });

        return {
          _id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          department: member.department,
          position: member.position,
          currentWorkload: assignedComplaints
        };
      })
    );

    // Sort by workload
    staffWithWorkload.sort((a, b) => a.currentWorkload - b.currentWorkload);

    res.json({ staff: staffWithWorkload });
  } catch (error) {
    console.error('Get available staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
