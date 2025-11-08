import express from 'express';
import { body } from 'express-validator';
import { 
  createReview,
  getPublishedReviews,
  getMyReviews,
  getAllReviewsForAdmin,
  approveReview,
  deleteReview
} from '../controllers/reviewController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Public routes
router.get('/', getPublishedReviews);

// Authenticated user routes
router.get('/my-reviews', auth, getMyReviews);

router.post(
  '/',
  auth,
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('comment').notEmpty().withMessage('Comment is required')
  ],
  createReview
);

// Admin routes - IMPORTANT: This must come BEFORE any route with :id parameter
router.get('/admin/all', auth, adminAuth, getAllReviewsForAdmin);
router.put('/admin/:id', auth, adminAuth, approveReview);
router.delete('/admin/:id', auth, adminAuth, deleteReview);

export default router;
