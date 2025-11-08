import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Review from '../models/Review';
import Booking from '../models/Booking';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { bookingId, rating, title, comment, experienceType, images } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (booking.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'You can only review your own bookings' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed bookings' });

    const existing = await Review.findOne({ user: req.user._id, booking: bookingId });
    if (existing) return res.status(400).json({ message: 'You have already reviewed this booking' });

    const review = new Review({
      user: req.user._id,
      booking: bookingId,
      rating: Math.max(1, Math.min(5, Number(rating || 5))),
      title: String(title || '').trim(),
      comment: String(comment || '').trim(),
      experienceType: experienceType || booking.type,
      images: Array.isArray(images) ? images : []
    });

    await review.save();
    return res.status(201).json({ message: 'Review submitted. Pending admin approval.', review });
  } catch (err) {
    console.error('createReview error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getPublishedReviews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, rating, experienceType } = req.query;
    const filter: any = { isApproved: true, isPublished: true };
    if (rating) filter.rating = parseInt(rating as string);
    if (experienceType && experienceType !== 'all') filter.experienceType = experienceType;

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(filter);
    return res.json({ reviews, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (err) {
    console.error('getPublishedReviews error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const reviews = await Review.find({ user: req.user._id }).populate('booking').sort({ createdAt: -1 });
    return res.json({ reviews });
  } catch (err) {
    console.error('getMyReviews error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAllReviewsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user as any).role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { page = 1, limit = 50, status = 'all', rating } = req.query;
    const filter: any = {};
    if (status === 'pending') filter.isApproved = false;
    else if (status === 'approved') filter.isApproved = true;
    if (rating) filter.rating = parseInt(rating as string);

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('booking', 'type checkIn checkOut')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(filter);
    return res.json({ reviews, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (err) {
    console.error('getAllReviewsForAdmin error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user as any).role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { isApproved = false, isPublished = false, adminResponse } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved, isPublished, adminResponse }, { new: true }).populate('user', 'firstName lastName email');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    return res.json({ message: 'Review updated', review });
  } catch (err) {
    console.error('approveReview error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user as any).role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    return res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('deleteReview error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
