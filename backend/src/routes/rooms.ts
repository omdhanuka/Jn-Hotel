import express from 'express';
import { body } from 'express-validator';
import { 
  getRooms, 
  getRoomById, 
  createRoom, 
  updateRoom, 
  deleteRoom,
  checkAvailability,
  seedRooms
} from '../controllers/roomController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms with filters
// @access  Public
router.get('/', getRooms);

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Public
router.get('/:id', getRoomById);

// @route   POST /api/rooms/availability
// @desc    Check room availability
// @access  Public
router.post('/availability', [
  body('checkIn').isISO8601().withMessage('Check-in date is required'),
  body('checkOut').isISO8601().withMessage('Check-out date is required'),
  body('guests').isNumeric().withMessage('Number of guests is required')
], checkAvailability);

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private (Admin only)
router.post('/', [auth, adminAuth], [
  body('roomNumber').notEmpty().withMessage('Room number is required'),
  body('type').isIn(['standard', 'deluxe', 'suite', 'presidential']).withMessage('Invalid room type'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('price').isNumeric().withMessage('Price must be a number')
], createRoom);

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin only)
router.put('/:id', [auth, adminAuth], updateRoom);

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], deleteRoom);

// @route   POST /api/rooms/seed
// @desc    Seed sample room data
// @access  Public (for development)
router.post('/seed', seedRooms);

export default router;
