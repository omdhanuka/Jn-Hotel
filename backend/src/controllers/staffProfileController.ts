import { Request, Response } from 'express';
import StaffProfile from '../models/StaffProfile';
import StaffTask from '../models/StaffTask';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await StaffProfile.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email phoneNumber')
      .populate('assignedManager', 'firstName lastName email');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber, emergencyContact, address } = req.body;

    const profile = await StaffProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (phoneNumber) {
      await User.findByIdAndUpdate(req.user._id, { phoneNumber });
    }

    if (emergencyContact) profile.emergencyContact = emergencyContact;
    if (address) profile.address = address;

    await profile.save();

    res.json({ message: 'Profile updated', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyPerformanceMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await StaffProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ performanceMetrics: profile.performanceMetrics });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await StaffTask.find({ assignedTo: req.user._id })
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ activityLog: tasks });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
