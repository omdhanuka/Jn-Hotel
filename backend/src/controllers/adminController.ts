import { Request, Response } from 'express';
import Booking from '../models/Booking';
import User from '../models/User';
import Room from '../models/Room';
import Order from '../models/Order';
import Review from '../models/Review';
import StaffProfile from '../models/StaffProfile';
import Complaint from '../models/Complaint';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Auto-update confirmed bookings to completed if checkout date has passed
    const now = new Date();
    await Booking.updateMany(
      {
        status: 'confirmed',
        checkOut: { $lt: now }
      },
      {
        $set: { status: 'completed' }
      }
    );

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Total counts
    const totalRooms = await Room.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'guest' });
    const totalBookings = await Booking.countDocuments();

    // Today's stats
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    const todayRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Calculate average guest rating from approved reviews
    const ratingStats = await Review.aggregate([
      {
        $match: {
          isApproved: true
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const avgRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
    const totalReviews = ratingStats.length > 0 ? ratingStats[0].totalReviews : 0;

    // Occupancy rate
    const occupiedRooms = await Booking.countDocuments({
      type: 'room',
      status: 'confirmed',
      checkIn: { $lte: today },
      checkOut: { $gt: today }
    });

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalRooms,
        totalUsers,
        totalBookings,
        todayBookings,
        todayRevenue: todayRevenue[0]?.total || 0,
        occupancyRate: Math.round(occupancyRate),
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        totalReviews
      },
      recentBookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 })
      .lean();

    // For staff users, fetch their staff profiles
    const usersWithStaffData = await Promise.all(
      users.map(async (user: any) => {
        if (user.role === 'staff') {
          const staffProfile = await StaffProfile.findOne({ user: user._id })
            .select('staffId staffType department joiningDate')
            .lean();
          return {
            ...user,
            staffProfile
          };
        }
        return user;
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      users: usersWithStaffData,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    
    if (!['guest', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, isActive } = req.body;
    
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRevenue = async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case 'day':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        };
        break;
      case 'week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { $gte: weekStart } };
        break;
      case 'month':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        };
        break;
      case 'year':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1)
          }
        };
        break;
    }

    const revenue = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenue.reduce((sum, item) => sum + item.total, 0);

    res.json({
      period,
      totalRevenue,
      revenueByType: revenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOccupancyRate = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    
    const totalRooms = await Room.countDocuments();
    
    const occupiedRooms = await Booking.countDocuments({
      type: 'room',
      status: 'confirmed',
      checkIn: { $lte: today },
      checkOut: { $gt: today }
    });

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Get occupancy for the last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const occupied = await Booking.countDocuments({
        type: 'room',
        status: 'confirmed',
        checkIn: { $lte: endOfDay },
        checkOut: { $gt: startOfDay }
      });

      last30Days.push({
        date: startOfDay.toISOString().split('T')[0],
        occupancyRate: totalRooms > 0 ? (occupied / totalRooms) * 100 : 0
      });
    }

    res.json({
      currentOccupancyRate: Math.round(occupancyRate),
      totalRooms,
      occupiedRooms,
      last30Days
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status = 'all', rating } = req.query;
    const filter: any = {};
    if (status === 'pending') filter.isApproved = false;
    else if (status === 'approved') filter.isApproved = true;
    if (rating) filter.rating = parseInt(rating as string);

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('booking', 'type checkIn checkOut')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(filter);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllStaff = async (req: Request, res: Response) => {
  try {
    // Query should include staff, reception, manager, and admin roles
    const staff = await User.find({ 
      role: { $in: ['staff', 'reception', 'manager', 'admin'] } 
    })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`📊 Total staff/managers found: ${staff.length}`);
    console.log(`   - Managers: ${staff.filter(s => s.role === 'manager').length}`);
    console.log(`   - Staff: ${staff.filter(s => s.role === 'staff').length}`);
    console.log(`   - Reception: ${staff.filter(s => s.role === 'reception').length}`);
    console.log(`   - Admin: ${staff.filter(s => s.role === 'admin').length}`);

    // Debug: log first staff member to check structure
    if (staff.length > 0) {
      console.log('Sample staff member:', {
        name: `${staff[0].firstName} ${staff[0].lastName}`,
        email: staff[0].email,
        role: staff[0].role,
        isActive: staff[0].isActive,
        permissions: staff[0].permissions
      });
    }

    res.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, role, department, position, isActive, permissions } = req.body;

    console.log('📝 Creating staff/manager with data:', { 
      email, 
      role, 
      firstName, 
      lastName,
      hasPermissions: !!permissions 
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields: firstName, lastName, email, password' 
      });
    }

    // Validate role
    const validRoles = ['staff', 'reception', 'admin', 'manager'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be one of: staff, reception, manager, admin',
        providedRole: role 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered',
        existingRole: existingUser.role 
      });
    }

    // Create default permissions for non-admin roles
    const defaultPermissions = role === 'admin' ? {} : {
      viewBookings: false,
      manageBookings: false,
      viewRooms: false,
      manageRooms: false,
      viewBanquets: false,
      manageBanquets: false,
      viewRestaurant: false,
      manageRestaurant: false,
      viewOrders: false,
      manageOrders: false,
      viewReviews: false,
      manageReviews: false,
      viewUsers: false,
      manageUsers: false,
      viewReports: false,
      manageBills: false,
      ...permissions // Merge with provided permissions
    };

    // Create new staff member
    const staff = new User({
      firstName,
      lastName,
      email,
      password,
      phone: phone || '',
      role: role,
      department: department || '',
      position: position || '',
      isActive: isActive !== undefined ? isActive : true,
      permissions: defaultPermissions
    });

    await staff.save();

    // Auto-create StaffProfile if role is 'staff'
    if (role === 'staff' && department) {
      try {
        // Map department to staffType
        const staffTypeMap: { [key: string]: 'housekeeping' | 'maintenance' | 'frontdesk' | 'restaurant' | 'banquet' } = {
          'housekeeping': 'housekeeping',
          'maintenance': 'maintenance',
          'front desk': 'frontdesk',
          'restaurant': 'restaurant',
          'banquet': 'banquet'
        };

        const staffType = staffTypeMap[department.toLowerCase()];
        
        if (staffType) {
          // Generate unique staffId
          const staffCount = await StaffProfile.countDocuments();
          const staffId = `STAFF-${String(staffCount + 1).padStart(4, '0')}`;

          const staffProfile = new StaffProfile({
            user: staff._id,
            staffId: staffId,
            staffType: staffType,
            department: department,
            joiningDate: new Date(),
            isActive: isActive !== undefined ? isActive : true,
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
          console.log(`✅ StaffProfile created for ${staffType} staff: ${staffId}`);
        }
      } catch (profileError) {
        console.error('Failed to create StaffProfile:', profileError);
        // Don't fail the whole request if profile creation fails
      }
    }

    // Verify the saved staff member
    const savedStaff = await User.findById(staff._id).select('-password');
    
    if (!savedStaff) {
      throw new Error('Failed to retrieve saved staff member');
    }

    console.log(`✅ ${role.toUpperCase()} created successfully:`, {
      id: savedStaff._id,
      email: savedStaff.email,
      name: `${savedStaff.firstName} ${savedStaff.lastName}`,
      role: savedStaff.role,
      isActive: savedStaff.isActive
    });

    res.status(201).json({ 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      staff: savedStaff 
    });
  } catch (error: any) {
    console.error('Create staff error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, role, department, position, isActive, permissions } = req.body;

    // Validate role if provided
    if (role) {
      const validRoles = ['staff', 'reception', 'admin', 'manager'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          message: 'Invalid role. Must be one of: staff, reception, manager, admin' 
        });
      }
    }

    const updateData: any = {
      firstName,
      lastName,
      email,
      phone,
      role, // Include role in update
      department,
      position,
      isActive
    };

    // Only update permissions for non-admin roles
    if (role !== 'admin') {
      updateData.permissions = permissions;
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      // Password will be hashed by the pre-save middleware
      const user = await User.findById(req.params.id);
      if (user) {
        user.password = password;
        await user.save();
      }
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    console.log(`✅ ${staff.role.toUpperCase()} updated: ${staff.email} (${staff.firstName} ${staff.lastName})`);

    res.json({ 
      message: `${staff.role.charAt(0).toUpperCase() + staff.role.slice(1)} updated successfully`,
      staff 
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const staff = await User.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateStaffStatus = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sync staff profiles - creates missing StaffProfile records for existing staff
export const syncStaffProfiles = async (req: Request, res: Response) => {
  try {
    const staffUsers = await User.find({ role: 'staff', isActive: true });
    let created = 0;
    let skipped = 0;

    for (const user of staffUsers) {
      // Check if profile already exists
      const existingProfile = await StaffProfile.findOne({ user: user._id });
      
      if (existingProfile) {
        skipped++;
        continue;
      }

      if (!user.department) {
        console.log(`⚠️ Skipping user ${user.email} - no department`);
        skipped++;
        continue;
      }

      // Map department to staffType
      const staffTypeMap: { [key: string]: 'housekeeping' | 'maintenance' | 'frontdesk' | 'restaurant' | 'banquet' } = {
        'housekeeping': 'housekeeping',
        'maintenance': 'maintenance',
        'front desk': 'frontdesk',
        'restaurant': 'restaurant',
        'banquet': 'banquet'
      };

      const staffType = staffTypeMap[user.department.toLowerCase()];
      
      if (!staffType) {
        console.log(`⚠️ Skipping user ${user.email} - unknown department: ${user.department}`);
        skipped++;
        continue;
      }

      // Generate unique staffId
      const staffCount = await StaffProfile.countDocuments();
      const staffId = `STAFF-${String(staffCount + created + 1).padStart(4, '0')}`;

      const staffProfile = new StaffProfile({
        user: user._id,
        staffId: staffId,
        staffType: staffType,
        department: user.department,
        joiningDate: new Date(),
        isActive: user.isActive,
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
      created++;
      console.log(`✅ Created StaffProfile for ${user.email} (${staffType})`);
    }

    res.json({ 
      message: 'Staff profiles synced successfully',
      created,
      skipped,
      total: staffUsers.length
    });
  } catch (error) {
    console.error('Sync staff profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's accessible sections based on permissions
 */
const getAccessibleSections = (user: any): string[] => {
  if (user.role === 'admin') {
    return ['dashboard', 'bookings', 'rooms', 'banquets', 'restaurant', 'orders', 'reviews', 'users', 'reports', 'bills', 'staff'];
  }

  const sections: string[] = ['dashboard']; // Everyone gets dashboard
  const permissions = user.permissions || {};

  if (permissions.viewBookings || permissions.manageBookings) sections.push('bookings');
  if (permissions.viewRooms || permissions.manageRooms) sections.push('rooms');
  if (permissions.viewBanquets || permissions.manageBanquets) sections.push('banquets');
  if (permissions.viewRestaurant || permissions.manageRestaurant) sections.push('restaurant');
  if (permissions.viewOrders || permissions.manageOrders) sections.push('orders');
  if (permissions.viewReviews || permissions.manageReviews) sections.push('reviews');
  if (permissions.viewUsers || permissions.manageUsers) sections.push('users');
  if (permissions.viewReports) sections.push('reports');
  if (permissions.manageBills) sections.push('bills');

  return sections;
};

export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('role permissions');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      role: user.role,
      permissions: user.permissions || {},
      accessibleSections: getAccessibleSections(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== COMPLAINT MANAGEMENT (FOR ADMIN) =====

export const getAllComplaintsForAdmin = async (req: Request, res: Response) => {
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
      .populate('booking', 'resourceId type')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    // Apply search
    if (search) {
      const searchLower = (search as string).toLowerCase();
      complaints = complaints.filter(c => {
        const userName = `${(c.user as any)?.firstName} ${(c.user as any)?.lastName}`.toLowerCase();
        const title = c.title?.toLowerCase() || '';
        const complaintId = c.complaintId?.toLowerCase() || '';
        return userName.includes(searchLower) || title.includes(searchLower) || complaintId.includes(searchLower);
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
    console.error('Get all complaints for admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComplaintDashboardForAdmin = async (req: Request, res: Response) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in-progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const highPriorityComplaints = await Complaint.countDocuments({ 
      priority: { $in: ['high', 'urgent'] },
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
    console.error('Get complaint dashboard for admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
