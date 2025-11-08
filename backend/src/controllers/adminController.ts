import { Request, Response } from 'express';
import Booking from '../models/Booking';
import User from '../models/User';
import Room from '../models/Room';
import Order from '../models/Order';
import Review from '../models/Review';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
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
        occupancyRate: Math.round(occupancyRate)
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
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
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
