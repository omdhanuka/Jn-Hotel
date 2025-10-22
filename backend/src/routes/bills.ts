import express from 'express';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import {
  createBill,
  getBills,
  getBillById
} from '../controllers/billController';

const router = express.Router();

// Generate restaurant bill
router.post('/restaurant', [auth, adminAuth], createBill);

// Get bills
router.get('/', [auth, adminAuth], getBills);
router.get('/:id', [auth, adminAuth], getBillById);

export default router;
