import express from 'express';
import { body } from 'express-validator';
import { 
  getRooms, 
  getRoomById, 
  createRoom, 
  updateRoom, 
  deleteRoom,
  checkAvailability,
  uploadRoomImages,
  getAvailableRoomsForBooking
} from '../controllers/roomController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { upload } from '../utils/imageUpload';

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms with filters
// @access  Public
router.get('/', getRooms);

// @route   GET /api/rooms/available-for-booking
// @desc    Get available rooms for booking dropdown
// @access  Public
router.get('/available-for-booking', getAvailableRoomsForBooking);

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
  body('type').isIn(['single', 'double', 'deluxe', 'suite', 'family', 'presidential']).withMessage('Invalid room type'),
  body('maxGuests').isNumeric().withMessage('Max guests must be a number'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('roomSize').notEmpty().withMessage('Room size is required'),
  body('floor').isNumeric().withMessage('Floor must be a number'),
  body('bedCount').isNumeric().withMessage('Bed count must be a number')
], createRoom);

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin only)
router.put('/:id', [auth, adminAuth], updateRoom);

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], deleteRoom);

// @route   POST /api/rooms/upload-images
// @desc    Upload room images
// @access  Private (Admin only)
router.post('/upload-images', [auth, adminAuth], upload.array('images', 10), uploadRoomImages);

export default router;

