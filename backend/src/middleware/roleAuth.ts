import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
  expectedRole?: string;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Your account is inactive. Contact admin.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(500).json({ 
      message: 'Token verification failed.',
      code: 'VERIFICATION_ERROR'
    });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.',
      code: 'ADMIN_ONLY',
      userRole: req.user.role
    });
  }

  next();
};

/**
 * Reception-only middleware (allows admin too)
 */
export const receptionOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'reception' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Reception Manager privileges required.',
      code: 'RECEPTION_ONLY',
      userRole: req.user.role
    });
  }

  next();
};

/**
 * Staff-only middleware (allows admin too)
 */
export const staffOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Staff privileges required.',
      code: 'STAFF_ONLY',
      userRole: req.user.role
    });
  }

  next();
};

/**
 * Manager-only middleware (allows admin too)
 */
export const managerOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Allow both manager and admin roles
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Manager privileges required.',
      code: 'MANAGER_ONLY',
      userRole: req.user.role
    });
  }

  next();
};

/**
 * Check if user account is active
 */
export const checkActiveStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Fetch fresh user data to check status
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ 
      message: 'User not found.',
      code: 'USER_NOT_FOUND'
    });
  }

  if (!user.isActive) {
    return res.status(403).json({ 
      message: 'Your account is inactive. Contact admin.',
      code: 'ACCOUNT_INACTIVE'
    });
  }

  next();
};

/**
 * Validate role on login
 */
export const validateLoginRole = (expectedRole?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required.',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Store expected role in request for auth controller to use
    (req as any).expectedRole = expectedRole;
    next();
  };
};
