import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const requireManagerAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Allow admin and manager roles
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Access denied. Manager or Admin privileges required.',
        code: 'INSUFFICIENT_PRIVILEGES',
        currentRole: req.user.role
      });
    }

    // Check if manager account is active
    if (req.user.role === 'manager' && !req.user.isActive) {
      return res.status(403).json({
        message: 'Your manager account is inactive. Contact admin.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    next();
  } catch (error) {
    console.error('Manager auth middleware error:', error);
    res.status(500).json({ message: 'Server error in manager authentication' });
  }
};

// Manager permissions check - managers cannot access admin-only features
export const denyAdminOnlyFeatures = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'manager') {
    return res.status(403).json({
      message: 'This feature is restricted to administrators only',
      code: 'ADMIN_ONLY_FEATURE'
    });
  }
  next();
};
