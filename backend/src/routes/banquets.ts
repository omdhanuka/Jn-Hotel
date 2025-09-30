import express from 'express';
import { body } from 'express-validator';
import { 
  getBanquets, 
  getBanquetById, 
  createBanquet, 
  updateBanquet, 
  deleteBanquet,
  checkBanquetAvailability 
} from '../controllers/banquetController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// @route   GET /api/banquets
// @desc    Get all banquet halls
// @access  Public
router.get('/', getBanquets);

// @route   GET /api/banquets/:id
// @desc    Get banquet by ID
// @access  Public
router.get('/:id', getBanquetById);

// @route   POST /api/banquets/availability
// @desc    Check banquet availability
// @access  Public
router.post('/availability', [
  body('date').isISO8601().withMessage('Event date is required'),
  body('guests').isNumeric().withMessage('Number of guests is required')
], checkBanquetAvailability);

// @route   POST /api/banquets
// @desc    Create new banquet hall
// @access  Private (Admin only)
router.post('/', [auth, adminAuth], [
  body('name').notEmpty().withMessage('Banquet name is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('price').isNumeric().withMessage('Price must be a number')
], createBanquet);

// @route   PUT /api/banquets/:id
// @desc    Update banquet hall
// @access  Private (Admin only)
router.put('/:id', [auth, adminAuth], updateBanquet);

// @route   DELETE /api/banquets/:id
// @desc    Delete banquet hall
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], deleteBanquet);

export default router;
