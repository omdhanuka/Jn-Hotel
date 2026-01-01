import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

// Staff authentication middleware
export const staffAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'staff') {
      return res.status(403).json({ message: 'Access denied. Staff role required.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Staff type-specific authentication
export const staffTypeAuth = (allowedTypes: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const StaffProfile = require('../models/StaffProfile').default;
      const profile = await StaffProfile.findOne({ user: req.user._id });

      if (!profile) {
        return res.status(403).json({ message: 'Staff profile not found' });
      }

      if (!allowedTypes.includes(profile.staffType)) {
        return res.status(403).json({ 
          message: `Access denied. Required staff type: ${allowedTypes.join(' or ')}` 
        });
      }

      req.user.staffProfile = profile;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error during authorization' });
    }
  };
};

// Prevent staff from accessing admin/manager routes
export const restrictStaffAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'staff') {
    return res.status(403).json({ 
      message: 'Staff members cannot access this resource' 
    });
  }
  next();
};

export default staffAuth;
