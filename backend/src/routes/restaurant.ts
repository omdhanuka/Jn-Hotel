import express from 'express';
import { body } from 'express-validator';
import { 
  getTables, 
  getTableById, 
  createTable, 
  updateTable, 
  deleteTable,
  checkTableAvailability,
  makeReservation 
} from '../controllers/restaurantController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// @route   GET /api/restaurant/tables
// @desc    Get all tables
// @access  Public
router.get('/tables', getTables);

// @route   GET /api/restaurant/tables/:id
// @desc    Get table by ID
// @access  Public
router.get('/tables/:id', getTableById);

// @route   POST /api/restaurant/availability
// @desc    Check table availability
// @access  Public
router.post('/availability', [
  body('date').isISO8601().withMessage('Date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('guests').isNumeric().withMessage('Number of guests is required')
], checkTableAvailability);

// @route   POST /api/restaurant/reservations
// @desc    Make table reservation
// @access  Private
router.post('/reservations', auth, [
  body('tableId').notEmpty().withMessage('Table ID is required'),
  body('date').isISO8601().withMessage('Date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('guests').isNumeric().withMessage('Number of guests is required')
], makeReservation);

// @route   POST /api/restaurant/tables
// @desc    Create new table
// @access  Private (Admin only)
router.post('/tables', [auth, adminAuth], [
  body('tableNumber').notEmpty().withMessage('Table number is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('location').isIn(['indoor', 'outdoor']).withMessage('Invalid location')
], createTable);

// @route   PUT /api/restaurant/tables/:id
// @desc    Update table
// @access  Private (Admin only)
router.put('/tables/:id', [auth, adminAuth], updateTable);

// @route   DELETE /api/restaurant/tables/:id
// @desc    Delete table
// @access  Private (Admin only)
router.delete('/tables/:id', [auth, adminAuth], deleteTable);

export default router;
