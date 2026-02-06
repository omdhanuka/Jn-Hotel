import express from 'express';
import {
  getAllOffers,
  getOfferById,
  getOfferByCode,
  createOffer,
  updateOffer,
  toggleOfferStatus,
  deleteOffer
} from '../controllers/offerController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Public routes
router.get('/', getAllOffers);
router.get('/:id', getOfferById);
router.get('/code/:code', getOfferByCode);

// Admin routes
router.post('/', auth, adminAuth, createOffer);
router.put('/:id', auth, adminAuth, updateOffer);
router.patch('/:id/toggle', auth, adminAuth, toggleOfferStatus);
router.delete('/:id', auth, adminAuth, deleteOffer);

export default router;
