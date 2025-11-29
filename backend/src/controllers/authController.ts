import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { sendWelcomeEmail } from '../utils/emailService';

interface AuthRequest extends Request {
  user?: any;
}

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email
    await sendWelcomeEmail(user.email, user.firstName);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const expectedRole = (req as any).expectedRole; // From middleware

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Your account is inactive. Contact admin.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Validate role if expected role is provided
    if (expectedRole && user.role !== expectedRole && user.role !== 'admin') {
      // Allow admin to login anywhere, but other roles must match
      return res.status(403).json({ 
        message: `Access denied. This login is for ${expectedRole} only. Your role is ${user.role}.`,
        code: 'WRONG_ROLE',
        expectedRole,
        userRole: user.role,
        redirectUrl: getRoleRedirectUrl(user.role)
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      position: user.position,
      isActive: user.isActive
    };

    console.log(`✅ Login successful - User: ${user.email}, Role: ${user.role}, Redirect: ${getRoleRedirectUrl(user.role)}`);

    res.json({ 
      token, 
      user: userData,
      redirectUrl: getRoleRedirectUrl(user.role)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get redirect URL based on user role
 */
const getRoleRedirectUrl = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'manager':
      return '/manager/dashboard';
    case 'reception':
      return '/reception/dashboard';
    case 'staff':
      return '/staff/dashboard';
    default:
      return '/dashboard';
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { firstName, lastName, phone },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, adminKey } = req.body;

    // Check admin key (from environment variables)
    const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY || 'hotel_admin_2024_secure_key';
    if (adminKey !== ADMIN_CREATION_KEY) {
      return res.status(403).json({ message: 'Invalid admin creation key' });
    }

    // Check if admin already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create admin user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      phone: '000-000-0000', // Default phone for admin
      role: 'admin',
      loyaltyPoints: 0
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints
      }
    });
  } catch (error) {
    console.error(error);
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

  const sections: string[] = ['dashboard'];
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

export const getUserOwnPermissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id).select('role permissions department position');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      role: user.role,
      department: user.department,
      position: user.position,
      permissions: user.permissions || {},
      accessibleSections: getAccessibleSections(user)
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
