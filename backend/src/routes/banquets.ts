import express from 'express';
import { body } from 'express-validator';
import { 
  getBanquets, 
  getBanquetById, 
  createBanquet, 
  updateBanquet, 
  deleteBanquet,
  uploadBanquetImages,
  deleteBanquetImage
} from '../controllers/banquetController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { upload } from '../config/multer';
import { cacheMiddleware } from '../utils/cache';

const router = express.Router();

// @route   GET /api/banquets
// @desc    Get all banquets with filters
// @access  Public
// Cache for 10 minutes - banquets don't change often
router.get('/', cacheMiddleware(600), getBanquets);

// @route   GET /api/banquets/:id
// @desc    Get banquet by ID
// @access  Public
// Cache for 5 minutes
router.get('/:id', cacheMiddleware(300), getBanquetById);

// @route   POST /api/banquets/upload-images
// @desc    Upload banquet images
// @access  Private (Admin only)
router.post('/upload-images', [auth, adminAuth], upload.array('images', 10), uploadBanquetImages);

// @route   DELETE /api/banquets/images/:filename
// @desc    Delete banquet image
// @access  Private (Admin only)
router.delete('/images/:filename', [auth, adminAuth], deleteBanquetImage);

// @route   POST /api/banquets
// @desc    Create new banquet
// @access  Private (Admin only)
router.post('/', [auth, adminAuth], [
  body('name').notEmpty().withMessage('Banquet name is required'),
  body('type').isIn(['wedding', 'conference', 'party', 'meeting', 'reception', 'corporate']).withMessage('Invalid banquet type'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('pricePerDay').isNumeric().withMessage('Price per day must be a number'),
  body('pricePerHour').isNumeric().withMessage('Price per hour must be a number'),
  body('description').notEmpty().withMessage('Description is required'),
  body('area').notEmpty().withMessage('Area is required'),
  body('floor').isNumeric().withMessage('Floor must be a number'),
  body('location').notEmpty().withMessage('Location is required')
], createBanquet);

// @route   PUT /api/banquets/:id
// @desc    Update banquet
// @access  Private (Admin only)
router.put('/:id', [auth, adminAuth], updateBanquet);

// @route   DELETE /api/banquets/:id
// @desc    Delete banquet
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], deleteBanquet);

export default router;
