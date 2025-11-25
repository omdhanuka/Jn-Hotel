import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    const permissions = req.user.permissions || {};
    const hasPermission = (permissions as any)[permission];

    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermission: permission
      });
    }

    next();
  };
};

/**
 * Check if user has any of the specified permissions
 */
export const requireAnyPermission = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has any of the required permissions
    const userPermissions = req.user.permissions || {};
    const hasAnyPermission = permissions.some(perm => (userPermissions as any)[perm]);

    if (!hasAnyPermission) {
      return res.status(403).json({ 
        message: `Access denied. Required one of: ${permissions.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions
      });
    }

    next();
  };
};

/**
 * Get user's accessible sections based on permissions
 */
export const getAccessibleSections = (user: IUser): string[] => {
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
