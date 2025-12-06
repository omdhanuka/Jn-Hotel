import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { register, login, getProfile, updateProfile, getUserOwnPermissions } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validateLoginRole } from '../middleware/roleAuth';
import User from '../models/User';

const router = express.Router();

// @route   GET /api/auth/test
// @desc    Test auth route
// @access  Public
router.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Auth route is working!',
    timestamp: new Date().toISOString(),
    route: '/api/auth/test'
  });
});

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
], register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
], login);

// Role-specific login routes
router.post('/login/staff', 
  (req, res, next) => {
    (req as any).expectedRole = 'staff';
    next();
  },
  login
);

router.post('/login/reception',
  (req, res, next) => {
    (req as any).expectedRole = 'reception';
    next();
  },
  login
);

router.post('/login/manager',
  (req, res, next) => {
    (req as any).expectedRole = 'manager';
    next();
  },
  login
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getProfile);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   GET /api/auth/me/permissions
// @desc    Get current user's permissions
// @access  Private
router.get('/me/permissions', auth, getUserOwnPermissions);

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], updateProfile);

// @route   POST /api/auth/manager/login
// @desc    Manager login
// @access  Public
router.post('/manager/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists and is a manager or admin
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify the user is a manager or admin
    if (user.role !== 'manager' && user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Manager privileges required.',
        role: user.role 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log(`✅ Manager login successful: ${email} (${user.firstName} ${user.lastName})`);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position
      }
    });
  } catch (error) {
    console.error('Manager login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/staff/login
// @desc    Staff login
// @access  Public
router.post('/staff/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists and is staff or reception
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify the user is staff or reception
    if (user.role !== 'staff' && user.role !== 'reception') {
      return res.status(403).json({ 
        message: 'Access denied. Staff privileges required.',
        role: user.role 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log(`✅ Staff login successful: ${email} (${user.firstName} ${user.lastName})`);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
